# -----------------------------------------------------------------------------
# File: openai.py
# Description: OpenAI-compatible provider (DashScope, self-hosted models)
# Author: Houston Zhang
# Date: 2025-11-09
# -----------------------------------------------------------------------------

import os
import base64
from typing import Any, Dict, List, Optional, Union
from dataclasses import dataclass
from openai import OpenAI


@dataclass
class ChatMessage:
    """
    Represents a chat message.

    Args:
        role: Message role ("user", "assistant", "system")
        content: Can be:
            - str: Plain text
            - List[Dict]: Multi-modal (text + images)
    """
    role: str
    content: Union[str, List[Dict[str, Any]]]


@dataclass
class ChatResponse:
    """
    Response from chat completion.

    Args:
        content: Response text
        usage: Token usage stats
        model: Model used
        finish_reason: Why generation stopped
    """
    content: str
    usage: Optional[Dict[str, int]] = None
    model: Optional[str] = None
    finish_reason: Optional[str] = None


def prepare_image_content(image_path: str) -> Dict[str, Any]:
    """
    Prepare image for OpenAI-compatible API (local file or base64).

    Args:
        image_path: Local file path (will be converted to base64 data URL)

    Returns:
        Image content dict in OpenAI format:
        {"type": "image_url", "image_url": {"url": "data:image/...;base64,..."}}

    Examples:
        >>> content = prepare_image_content("/path/to/image.png")
        >>> content = prepare_image_content("/path/to/image.jpg")
    """
    # Get MIME type from file extension
    ext = os.path.splitext(image_path)[1].lower()
    mime_type_map = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
    }
    mime_type = mime_type_map.get(ext, 'image/jpeg')

    # Read and encode image to base64
    with open(image_path, 'rb') as f:
        image_data = f.read()

    base64_image = base64.b64encode(image_data).decode('utf-8')

    # Construct data URL
    data_url = f"data:{mime_type};base64,{base64_image}"

    return {
        "type": "image_url",
        "image_url": {"url": data_url}
    }


class OpenAIProvider:
    """
    OpenAI-compatible provider for DashScope and self-hosted models.

    Supports:
    - DashScope Beijing: https://dashscope.aliyuncs.com/compatible-mode/v1
    - DashScope Singapore: https://dashscope-intl.aliyuncs.com/compatible-mode/v1
    - Self-hosted (vLLM, Ollama, etc.): http://localhost:8000/v1

    Examples:
        >>> # DashScope Beijing
        >>> provider = OpenAIProvider(
        ...     model="qwen3-vl-plus",
        ...     api_key="sk-xxx",
        ...     base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        ...     thinking=True
        ... )

        >>> # Self-hosted model
        >>> provider = OpenAIProvider(
        ...     model="qwen2.5-vl-72b",
        ...     api_key="your-key",
        ...     base_url="http://localhost:8000/v1"
        ... )
    """

    def __init__(
        self,
        model: str,
        api_key: str,
        base_url: Optional[str] = None,
        temperature: float = 0.5,
        top_k: Optional[int] = None,
        max_tokens: int = 2000,
        timeout: int = 60,
        thinking: bool = False,
        thinking_budget: int = 500,
        vl_high_resolution: bool = False,
        **kwargs
    ):
        """
        Initialize OpenAI-compatible provider.

        Args:
            model: Model name (e.g., "qwen3-vl-plus", "qwen3-vl-flash")
            api_key: API key for authentication
            base_url: API endpoint URL (optional, defaults to OpenAI)
            temperature: Sampling temperature (0.0-1.0)
            top_k: Top-k sampling parameter (optional)
            max_tokens: Maximum tokens to generate
            timeout: Request timeout in seconds
            thinking: Enable thinking mode (qwen3-vl models only)
            thinking_budget: Max tokens for thinking process
            vl_high_resolution: Enable high-resolution mode for images
            **kwargs: Additional parameters
        """
        self.model = model
        self.api_key = api_key
        self.base_url = base_url
        self.temperature = temperature
        self.top_k = top_k
        self.max_tokens = max_tokens
        self.timeout = timeout
        self.thinking = thinking
        self.thinking_budget = thinking_budget
        self.vl_high_resolution = vl_high_resolution
        self.extra_params = kwargs

        # Create OpenAI client
        self.client = OpenAI(
            api_key=api_key,
            base_url=base_url,
            timeout=timeout,
        )

    def chat(
        self,
        messages: List[ChatMessage],
        **kwargs
    ) -> ChatResponse:
        """
        Send chat completion request.

        Args:
            messages: List of ChatMessage objects
            **kwargs: Override parameters (temperature, top_k, max_tokens, etc.)

        Returns:
            ChatResponse with model output

        Examples:
            >>> messages = [
            ...     ChatMessage(role="user", content=[
            ...         {"type": "text", "text": "这是什么"},
            ...         prepare_image_content("/path/to/image.png")
            ...     ])
            ... ]
            >>> response = provider.chat(messages)
            >>> print(response.content)
        """
        # Convert ChatMessage to OpenAI format
        formatted_messages = []
        for msg in messages:
            formatted_messages.append({
                "role": msg.role,
                "content": msg.content
            })

        # Prepare extra_body for DashScope-specific parameters
        extra_body = {}
        if self.thinking:
            extra_body['enable_thinking'] = True
            extra_body['thinking_budget'] = self.thinking_budget
        if self.vl_high_resolution:
            extra_body['vl_high_resolution_images'] = True

        # Add top_k if provided
        top_k = kwargs.get('top_k', self.top_k)
        if top_k is not None:
            extra_body['top_k'] = top_k

        # Override with extra_params
        extra_body.update(self.extra_params.get('extra_body', {}))

        # Merge kwargs
        temperature = kwargs.get('temperature', self.temperature)
        max_tokens = kwargs.get('max_tokens', self.max_tokens)

        # Call OpenAI API (non-streaming only)
        completion = self.client.chat.completions.create(
            model=self.model,
            messages=formatted_messages,
            temperature=temperature,
            max_tokens=max_tokens,
            extra_body=extra_body if extra_body else None,
        )

        # Extract response
        content = completion.choices[0].message.content
        usage = {
            "prompt_tokens": completion.usage.prompt_tokens,
            "completion_tokens": completion.usage.completion_tokens,
            "total_tokens": completion.usage.total_tokens,
        } if completion.usage else None

        return ChatResponse(
            content=content,
            usage=usage,
            model=completion.model,
            finish_reason=completion.choices[0].finish_reason
        )
