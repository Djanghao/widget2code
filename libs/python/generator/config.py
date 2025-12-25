# -----------------------------------------------------------------------------
# File: config.py
# Description: Configuration classes for generator
# Author: Houston Zhang
# Date: 2025-10-29
# -----------------------------------------------------------------------------

import os
from dataclasses import dataclass
from typing import Optional


@dataclass
class GeneratorConfig:
    """Configuration for widget generator with DEFAULT + stage-specific override pattern"""
    # Security
    max_file_size_mb: int

    # Generation parameters
    retrieval_topk: int = 50
    retrieval_topm: int = 10
    retrieval_alpha: float = 0.8
    concurrency: int = 3
    requests_per_minute: int = 60  # Global LLM API rate limit (0 to disable)

    # Pipeline feature flags
    enable_layout_pipeline: bool = True
    enable_icon_pipeline: bool = True
    enable_graph_pipeline: bool = True
    enable_color_pipeline: bool = True

    # Stage-specific timeouts (in seconds)
    default_timeout: int = 500
    layout_timeout: Optional[int] = None
    graph_gen_timeout: Optional[int] = None
    dsl_gen_timeout: Optional[int] = None
    icon_retrieval_timeout: Optional[int] = None
    
    # Max tokens configuration (per-stage with default fallback)
    default_max_tokens: Optional[int] = None
    layout_max_tokens: Optional[int] = None
    graph_gen_max_tokens: Optional[int] = None
    dsl_gen_max_tokens: Optional[int] = None
    # Retries
    layout_max_retries: Optional[int] = None

    # ========================================================================
    # Default settings (used as fallback for all stages)
    # ========================================================================
    default_api_key: str = ""
    default_model: str = "qwen3-vl-plus"
    default_base_url: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    default_temperature: float = 0.5
    default_top_k: Optional[int] = None
    default_top_p: Optional[float] = None
    default_enable_thinking: bool = True
    default_thinking_budget: int = 500
    default_vl_high_resolution: bool = False

    # ========================================================================
    # Stage-specific overrides (Optional - if None, use default)
    # ========================================================================
    # Layout detection
    layout_api_key: Optional[str] = None
    layout_model: Optional[str] = None
    layout_base_url: Optional[str] = None
    layout_temperature: Optional[float] = None
    layout_top_k: Optional[int] = None
    layout_top_p: Optional[float] = None
    layout_enable_thinking: Optional[bool] = None
    layout_thinking_budget: Optional[int] = None
    layout_vl_high_resolution: Optional[bool] = None

    # Graph generation
    graph_gen_api_key: Optional[str] = None
    graph_gen_model: Optional[str] = None
    graph_gen_base_url: Optional[str] = None
    graph_gen_temperature: Optional[float] = None
    graph_gen_top_k: Optional[int] = None
    graph_gen_top_p: Optional[float] = None
    graph_gen_enable_thinking: Optional[bool] = None
    graph_gen_thinking_budget: Optional[int] = None
    graph_gen_vl_high_resolution: Optional[bool] = None

    # DSL generation
    dsl_gen_api_key: Optional[str] = None
    dsl_gen_model: Optional[str] = None
    dsl_gen_base_url: Optional[str] = None
    dsl_gen_temperature: Optional[float] = None
    dsl_gen_top_k: Optional[int] = None
    dsl_gen_top_p: Optional[float] = None
    dsl_gen_enable_thinking: Optional[bool] = None
    dsl_gen_thinking_budget: Optional[int] = None
    dsl_gen_vl_high_resolution: Optional[bool] = None

    # ========================================================================
    # Getter methods with fallback logic: stage-specific → default
    # ========================================================================

    # Layout detection getters
    def get_layout_api_key(self) -> str:
        """Get layout API key with fallback to default"""
        return self.layout_api_key if self.layout_api_key else self.default_api_key

    def get_layout_model(self) -> str:
        """Get layout model with fallback to default"""
        return self.layout_model if self.layout_model else self.default_model

    def get_layout_base_url(self) -> str:
        """Get layout base URL with fallback to default"""
        return self.layout_base_url if self.layout_base_url else self.default_base_url

    def get_layout_temperature(self) -> float:
        """Get layout temperature with fallback to default"""
        return self.layout_temperature if self.layout_temperature is not None else self.default_temperature

    def get_layout_top_k(self) -> Optional[int]:
        """Get layout top_k with fallback to default"""
        return self.layout_top_k if self.layout_top_k is not None else self.default_top_k

    def get_layout_top_p(self) -> Optional[float]:
        """Get layout top_p with fallback to default"""
        return self.layout_top_p if self.layout_top_p is not None else self.default_top_p

    def get_layout_thinking(self) -> bool:
        """Get layout thinking with fallback to default"""
        return self.layout_enable_thinking if self.layout_enable_thinking is not None else self.default_enable_thinking

    def get_layout_thinking_budget(self) -> int:
        """Get layout thinking budget with fallback to default"""
        return self.layout_thinking_budget if self.layout_thinking_budget is not None else self.default_thinking_budget

    def get_layout_vl_high_resolution(self) -> bool:
        """Get layout vl_high_resolution with fallback to default"""
        return self.layout_vl_high_resolution if self.layout_vl_high_resolution is not None else self.default_vl_high_resolution

    # Graph generation getters
    def get_graph_gen_api_key(self) -> str:
        """Get graph generation API key with fallback to default"""
        return self.graph_gen_api_key if self.graph_gen_api_key else self.default_api_key

    def get_graph_gen_model(self) -> str:
        """Get graph generation model with fallback to default"""
        return self.graph_gen_model if self.graph_gen_model else self.default_model

    def get_graph_gen_base_url(self) -> str:
        """Get graph generation base URL with fallback to default"""
        return self.graph_gen_base_url if self.graph_gen_base_url else self.default_base_url

    def get_graph_gen_temperature(self) -> float:
        """Get graph generation temperature with fallback to default"""
        return self.graph_gen_temperature if self.graph_gen_temperature is not None else self.default_temperature

    def get_graph_gen_top_k(self) -> Optional[int]:
        """Get graph generation top_k with fallback to default"""
        return self.graph_gen_top_k if self.graph_gen_top_k is not None else self.default_top_k

    def get_graph_gen_top_p(self) -> Optional[float]:
        """Get graph generation top_p with fallback to default"""
        return self.graph_gen_top_p if self.graph_gen_top_p is not None else self.default_top_p

    def get_graph_gen_thinking(self) -> bool:
        """Get graph generation thinking with fallback to default"""
        return self.graph_gen_enable_thinking if self.graph_gen_enable_thinking is not None else self.default_enable_thinking

    def get_graph_gen_thinking_budget(self) -> int:
        """Get graph generation thinking budget with fallback to default"""
        return self.graph_gen_thinking_budget if self.graph_gen_thinking_budget is not None else self.default_thinking_budget

    def get_graph_gen_vl_high_resolution(self) -> bool:
        """Get graph generation vl_high_resolution with fallback to default"""
        return self.graph_gen_vl_high_resolution if self.graph_gen_vl_high_resolution is not None else self.default_vl_high_resolution

    # DSL generation getters
    def get_dsl_gen_api_key(self) -> str:
        """Get DSL generation API key with fallback to default"""
        return self.dsl_gen_api_key if self.dsl_gen_api_key else self.default_api_key

    def get_dsl_gen_model(self) -> str:
        """Get DSL generation model with fallback to default"""
        return self.dsl_gen_model if self.dsl_gen_model else self.default_model

    def get_dsl_gen_base_url(self) -> str:
        """Get DSL generation base URL with fallback to default"""
        return self.dsl_gen_base_url if self.dsl_gen_base_url else self.default_base_url

    def get_dsl_gen_temperature(self) -> float:
        """Get DSL generation temperature with fallback to default"""
        return self.dsl_gen_temperature if self.dsl_gen_temperature is not None else self.default_temperature

    def get_dsl_gen_top_k(self) -> Optional[int]:
        """Get DSL generation top_k with fallback to default"""
        return self.dsl_gen_top_k if self.dsl_gen_top_k is not None else self.default_top_k

    def get_dsl_gen_top_p(self) -> Optional[float]:
        """Get DSL generation top_p with fallback to default"""
        return self.dsl_gen_top_p if self.dsl_gen_top_p is not None else self.default_top_p

    def get_dsl_gen_thinking(self) -> bool:
        """Get DSL generation thinking with fallback to default"""
        return self.dsl_gen_enable_thinking if self.dsl_gen_enable_thinking is not None else self.default_enable_thinking

    def get_dsl_gen_thinking_budget(self) -> int:
        """Get DSL generation thinking budget with fallback to default"""
        return self.dsl_gen_thinking_budget if self.dsl_gen_thinking_budget is not None else self.default_thinking_budget

    def get_dsl_gen_vl_high_resolution(self) -> bool:
        """Get DSL generation vl_high_resolution with fallback to default"""
        return self.dsl_gen_vl_high_resolution if self.dsl_gen_vl_high_resolution is not None else self.default_vl_high_resolution

    # ========================================================================
    # Timeout getters
    # ========================================================================
    def get_layout_timeout(self) -> int:
        """Get layout detection timeout with fallback to default"""
        return self.layout_timeout if self.layout_timeout is not None else self.default_timeout

    def get_graph_gen_timeout(self) -> int:
        """Get graph generation timeout with fallback to default"""
        return self.graph_gen_timeout if self.graph_gen_timeout is not None else self.default_timeout

    def get_dsl_gen_timeout(self) -> int:
        """Get DSL generation timeout with fallback to default"""
        return self.dsl_gen_timeout if self.dsl_gen_timeout is not None else self.default_timeout

    def get_icon_retrieval_timeout(self) -> int:
        """Get icon retrieval timeout with fallback to default"""
        return self.icon_retrieval_timeout if self.icon_retrieval_timeout is not None else self.default_timeout

    def get_layout_max_retries(self) -> int:
        """Get layout detection max retries (0 = no extra retry)"""
        return self.layout_max_retries if self.layout_max_retries is not None else 0

    # ========================================================================
    # Max tokens getters
    # ========================================================================
    def get_default_max_tokens(self) -> int:
        """Global default max tokens for stages that don't override explicitly"""
        return self.default_max_tokens if self.default_max_tokens is not None else 20000

    def get_layout_max_tokens(self) -> int:
        """Layout detection max tokens with fallback to default_max_tokens"""
        return self.layout_max_tokens if self.layout_max_tokens is not None else self.get_default_max_tokens()

    def get_graph_gen_max_tokens(self) -> int:
        """Graph generation max tokens with fallback to default_max_tokens"""
        return self.graph_gen_max_tokens if self.graph_gen_max_tokens is not None else self.get_default_max_tokens()

    def get_dsl_gen_max_tokens(self) -> int:
        """DSL generation max tokens with fallback to default_max_tokens"""
        return self.dsl_gen_max_tokens if self.dsl_gen_max_tokens is not None else self.get_default_max_tokens()

    # ========================================================================
    # Factory methods
    # ========================================================================

    @classmethod
    def from_dict(cls, config_dict: dict) -> 'GeneratorConfig':
        """Create config from dictionary (for backward compatibility)"""
        return cls(
            max_file_size_mb=config_dict['security']['max_file_size_mb'],
        )

    @classmethod
    def from_env(cls) -> 'GeneratorConfig':
        """Create config from environment variables"""

        def get_optional_str(key: str) -> Optional[str]:
            """Get optional string from env (empty string → None)"""
            value = os.getenv(key, '').strip()
            return value if value else None

        def get_optional_bool(key: str) -> Optional[bool]:
            """Get optional bool from env (empty string → None)"""
            value = os.getenv(key, '').strip()
            if not value:
                return None
            return value.lower() in ('true', '1', 'yes')

        def get_optional_int(key: str) -> Optional[int]:
            """Get optional int from env (empty string → None)"""
            value = os.getenv(key, '').strip()
            if not value:
                return None
            try:
                return int(value)
            except ValueError:
                return None

        def get_optional_float(key: str) -> Optional[float]:
            """Get optional float from env (empty string → None)"""
            value = os.getenv(key, '').strip()
            if not value:
                return None
            try:
                return float(value)
            except ValueError:
                return None

        return cls(
            # Security
            max_file_size_mb=int(os.getenv('MAX_FILE_SIZE_MB', '100')),

            # Generation parameters
            retrieval_topk=int(os.getenv('RETRIEVAL_TOPK', '50')),
            retrieval_topm=int(os.getenv('RETRIEVAL_TOPM', '10')),
            retrieval_alpha=float(os.getenv('RETRIEVAL_ALPHA', '0.8')),
            concurrency=int(os.getenv('CONCURRENCY', '3')),
            requests_per_minute=int(os.getenv('REQUESTS_PER_MINUTE', '60')),

            # Pipeline feature flags
            enable_layout_pipeline=os.getenv('ENABLE_LAYOUT_PIPELINE', 'true').lower() in ('true', '1', 'yes'),
            enable_icon_pipeline=os.getenv('ENABLE_ICON_PIPELINE', 'true').lower() in ('true', '1', 'yes'),
            enable_graph_pipeline=os.getenv('ENABLE_GRAPH_PIPELINE', 'true').lower() in ('true', '1', 'yes'),
            enable_color_pipeline=os.getenv('ENABLE_COLOR_PIPELINE', 'true').lower() in ('true', '1', 'yes'),

            # Timeouts
            default_timeout=int(os.getenv('DEFAULT_TIMEOUT', '500')),
            layout_timeout=get_optional_int('LAYOUT_TIMEOUT'),
            graph_gen_timeout=get_optional_int('GRAPH_GEN_TIMEOUT'),
            dsl_gen_timeout=get_optional_int('DSL_GEN_TIMEOUT'),
            icon_retrieval_timeout=get_optional_int('ICON_RETRIEVAL_TIMEOUT'),

            # Max tokens
            default_max_tokens=get_optional_int('DEFAULT_MAX_TOKENS'),
            layout_max_tokens=get_optional_int('LAYOUT_MAX_TOKENS'),
            graph_gen_max_tokens=get_optional_int('GRAPH_GEN_MAX_TOKENS'),
            dsl_gen_max_tokens=get_optional_int('DSL_GEN_MAX_TOKENS'),
            layout_max_retries=get_optional_int('LAYOUT_MAX_RETRIES'),

            # Default settings
            default_api_key=os.getenv('DEFAULT_API_KEY', ''),
            default_model=os.getenv('DEFAULT_MODEL', 'qwen3-vl-plus'),
            default_base_url=os.getenv('DEFAULT_BASE_URL', 'https://dashscope.aliyuncs.com/compatible-mode/v1'),
            default_temperature=float(os.getenv('DEFAULT_TEMPERATURE', '0.5')),
            default_top_k=get_optional_int('DEFAULT_TOP_K'),
            default_top_p=get_optional_float('DEFAULT_TOP_P'),
            default_enable_thinking=os.getenv('DEFAULT_ENABLE_THINKING', 'true').lower() in ('true', '1', 'yes'),
            default_thinking_budget=int(os.getenv('DEFAULT_THINKING_BUDGET', '500')),
            default_vl_high_resolution=os.getenv('DEFAULT_VL_HIGH_RESOLUTION', 'false').lower() in ('true', '1', 'yes'),

            # Layout detection (optional overrides)
            layout_api_key=get_optional_str('LAYOUT_API_KEY'),
            layout_model=get_optional_str('LAYOUT_MODEL'),
            layout_base_url=get_optional_str('LAYOUT_BASE_URL'),
            layout_temperature=get_optional_float('LAYOUT_TEMPERATURE'),
            layout_top_k=get_optional_int('LAYOUT_TOP_K'),
            layout_top_p=get_optional_float('LAYOUT_TOP_P'),
            layout_enable_thinking=get_optional_bool('LAYOUT_ENABLE_THINKING'),
            layout_thinking_budget=get_optional_int('LAYOUT_THINKING_BUDGET'),
            layout_vl_high_resolution=get_optional_bool('LAYOUT_VL_HIGH_RESOLUTION'),

            # Graph generation (optional overrides)
            graph_gen_api_key=get_optional_str('GRAPH_GEN_API_KEY'),
            graph_gen_model=get_optional_str('GRAPH_GEN_MODEL'),
            graph_gen_base_url=get_optional_str('GRAPH_GEN_BASE_URL'),
            graph_gen_temperature=get_optional_float('GRAPH_GEN_TEMPERATURE'),
            graph_gen_top_k=get_optional_int('GRAPH_GEN_TOP_K'),
            graph_gen_top_p=get_optional_float('GRAPH_GEN_TOP_P'),
            graph_gen_enable_thinking=get_optional_bool('GRAPH_GEN_ENABLE_THINKING'),
            graph_gen_thinking_budget=get_optional_int('GRAPH_GEN_THINKING_BUDGET'),
            graph_gen_vl_high_resolution=get_optional_bool('GRAPH_GEN_VL_HIGH_RESOLUTION'),

            # DSL generation (optional overrides)
            dsl_gen_api_key=get_optional_str('DSL_GEN_API_KEY'),
            dsl_gen_model=get_optional_str('DSL_GEN_MODEL'),
            dsl_gen_base_url=get_optional_str('DSL_GEN_BASE_URL'),
            dsl_gen_temperature=get_optional_float('DSL_GEN_TEMPERATURE'),
            dsl_gen_top_k=get_optional_int('DSL_GEN_TOP_K'),
            dsl_gen_top_p=get_optional_float('DSL_GEN_TOP_P'),
            dsl_gen_enable_thinking=get_optional_bool('DSL_GEN_ENABLE_THINKING'),
            dsl_gen_thinking_budget=get_optional_int('DSL_GEN_THINKING_BUDGET'),
            dsl_gen_vl_high_resolution=get_optional_bool('DSL_GEN_VL_HIGH_RESOLUTION'),
        )
