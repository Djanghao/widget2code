"""Configuration classes for widgetdsl_generator"""

from dataclasses import dataclass


@dataclass
class GeneratorConfig:
    """Configuration for widget generator"""
    max_file_size_mb: int
    max_requests_per_minute: int

    @classmethod
    def from_dict(cls, config_dict: dict) -> 'GeneratorConfig':
        """Create config from dictionary (e.g., from yaml.safe_load)"""
        return cls(
            max_file_size_mb=config_dict['security']['max_file_size_mb'],
            max_requests_per_minute=config_dict['security']['max_requests_per_minute'],
        )
