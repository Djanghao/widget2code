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
    timeout: int = 300
    concurrency: int = 3

    # ========================================================================
    # Default settings (used as fallback for all stages)
    # ========================================================================
    default_api_key: str = ""
    default_model: str = "qwen3-vl-plus"
    default_enable_thinking: bool = True

    # ========================================================================
    # Stage-specific overrides (Optional - if None, use default)
    # ========================================================================
    # Layout detection
    layout_api_key: Optional[str] = None
    layout_model: Optional[str] = None
    layout_enable_thinking: Optional[bool] = None

    # Graph detection
    graph_det_api_key: Optional[str] = None
    graph_det_model: Optional[str] = None
    graph_det_enable_thinking: Optional[bool] = None

    # Graph generation
    graph_gen_api_key: Optional[str] = None
    graph_gen_model: Optional[str] = None
    graph_gen_enable_thinking: Optional[bool] = None

    # DSL generation
    dsl_gen_api_key: Optional[str] = None
    dsl_gen_model: Optional[str] = None
    dsl_gen_enable_thinking: Optional[bool] = None

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

    def get_layout_thinking(self) -> bool:
        """Get layout thinking with fallback to default"""
        return self.layout_enable_thinking if self.layout_enable_thinking is not None else self.default_enable_thinking

    # Graph detection getters
    def get_graph_det_api_key(self) -> str:
        """Get graph detection API key with fallback to default"""
        return self.graph_det_api_key if self.graph_det_api_key else self.default_api_key

    def get_graph_det_model(self) -> str:
        """Get graph detection model with fallback to default"""
        return self.graph_det_model if self.graph_det_model else self.default_model

    def get_graph_det_thinking(self) -> bool:
        """Get graph detection thinking with fallback to default"""
        return self.graph_det_enable_thinking if self.graph_det_enable_thinking is not None else self.default_enable_thinking

    # Graph generation getters
    def get_graph_gen_api_key(self) -> str:
        """Get graph generation API key with fallback to default"""
        return self.graph_gen_api_key if self.graph_gen_api_key else self.default_api_key

    def get_graph_gen_model(self) -> str:
        """Get graph generation model with fallback to default"""
        return self.graph_gen_model if self.graph_gen_model else self.default_model

    def get_graph_gen_thinking(self) -> bool:
        """Get graph generation thinking with fallback to default"""
        return self.graph_gen_enable_thinking if self.graph_gen_enable_thinking is not None else self.default_enable_thinking

    # DSL generation getters
    def get_dsl_gen_api_key(self) -> str:
        """Get DSL generation API key with fallback to default"""
        return self.dsl_gen_api_key if self.dsl_gen_api_key else self.default_api_key

    def get_dsl_gen_model(self) -> str:
        """Get DSL generation model with fallback to default"""
        return self.dsl_gen_model if self.dsl_gen_model else self.default_model

    def get_dsl_gen_thinking(self) -> bool:
        """Get DSL generation thinking with fallback to default"""
        return self.dsl_gen_enable_thinking if self.dsl_gen_enable_thinking is not None else self.default_enable_thinking

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

        return cls(
            # Security
            max_file_size_mb=int(os.getenv('MAX_FILE_SIZE_MB', '100')),

            # Generation parameters
            retrieval_topk=int(os.getenv('RETRIEVAL_TOPK', '50')),
            retrieval_topm=int(os.getenv('RETRIEVAL_TOPM', '10')),
            retrieval_alpha=float(os.getenv('RETRIEVAL_ALPHA', '0.8')),
            timeout=int(os.getenv('TIMEOUT', '300')),
            concurrency=int(os.getenv('CONCURRENCY', '3')),

            # Default settings
            default_api_key=os.getenv('DEFAULT_API_KEY', ''),
            default_model=os.getenv('DEFAULT_MODEL', 'qwen3-vl-plus'),
            default_enable_thinking=os.getenv('DEFAULT_ENABLE_THINKING', 'true').lower() in ('true', '1', 'yes'),

            # Layout detection (optional overrides)
            layout_api_key=get_optional_str('LAYOUT_API_KEY'),
            layout_model=get_optional_str('LAYOUT_MODEL'),
            layout_enable_thinking=get_optional_bool('LAYOUT_ENABLE_THINKING'),

            # Graph detection (optional overrides)
            graph_det_api_key=get_optional_str('GRAPH_DET_API_KEY'),
            graph_det_model=get_optional_str('GRAPH_DET_MODEL'),
            graph_det_enable_thinking=get_optional_bool('GRAPH_DET_ENABLE_THINKING'),

            # Graph generation (optional overrides)
            graph_gen_api_key=get_optional_str('GRAPH_GEN_API_KEY'),
            graph_gen_model=get_optional_str('GRAPH_GEN_MODEL'),
            graph_gen_enable_thinking=get_optional_bool('GRAPH_GEN_ENABLE_THINKING'),

            # DSL generation (optional overrides)
            dsl_gen_api_key=get_optional_str('DSL_GEN_API_KEY'),
            dsl_gen_model=get_optional_str('DSL_GEN_MODEL'),
            dsl_gen_enable_thinking=get_optional_bool('DSL_GEN_ENABLE_THINKING'),
        )
