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
    """Configuration for widget generator"""
    # Security
    max_file_size_mb: int
    max_requests_per_minute: int

    # Generation parameters
    default_model: str = "qwen3-vl-flash"
    retrieval_topk: int = 50
    retrieval_topm: int = 10
    retrieval_alpha: float = 0.8
    timeout: int = 300

    @classmethod
    def from_dict(cls, config_dict: dict) -> 'GeneratorConfig':
        """Create config from dictionary (for backward compatibility)"""
        return cls(
            max_file_size_mb=config_dict['security']['max_file_size_mb'],
            max_requests_per_minute=config_dict['security']['max_requests_per_minute'],
        )

    @classmethod
    def from_env(cls) -> 'GeneratorConfig':
        """Create config from environment variables"""
        return cls(
            max_file_size_mb=int(os.getenv('MAX_FILE_SIZE_MB', '100')),
            max_requests_per_minute=int(os.getenv('MAX_REQUESTS_PER_MINUTE', '10')),
            default_model=os.getenv('DEFAULT_MODEL', 'qwen3-vl-flash'),
            retrieval_topk=int(os.getenv('RETRIEVAL_TOPK', '50')),
            retrieval_topm=int(os.getenv('RETRIEVAL_TOPM', '10')),
            retrieval_alpha=float(os.getenv('RETRIEVAL_ALPHA', '0.8')),
            timeout=int(os.getenv('TIMEOUT', '300')),
        )
