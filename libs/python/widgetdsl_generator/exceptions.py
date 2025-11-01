# -----------------------------------------------------------------------------
# File: exceptions.py
# Description: Custom exception classes for widgetdsl_generator
# Author: Houston Zhang
# Date: 2025-10-29
# -----------------------------------------------------------------------------


class GeneratorError(Exception):
    pass


class ValidationError(GeneratorError):
    pass


class RateLimitError(GeneratorError):
    pass


class FileSizeError(GeneratorError):
    pass


class GenerationError(GeneratorError):
    pass
