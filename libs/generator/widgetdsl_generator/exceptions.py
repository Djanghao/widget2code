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
