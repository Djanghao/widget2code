# WidgetDSL Generator

AI-powered widget generation library that converts images into WidgetDSL specifications.

## Features

- **Perception Module**: Advanced image preprocessing and analysis
- **Icon Services**: Icon detection, search, and matching
- **Graph Detection**: Automatic chart and visualization recognition
- **Layout Analysis**: Intelligent layout understanding and reconstruction

## Installation

### Development Mode (Editable Install)

```bash
pip install -e .
```

### With API Dependencies

```bash
pip install -e ".[api]"
```

## Usage

```python
from generator import WidgetGenerator

# Initialize generator
generator = WidgetGenerator()

# Generate widget from image
widget_dsl = generator.generate(image_path="input.png")
```

## Package Structure

```
generator/
├── generator.py          # Core generator
├── perception/           # Image preprocessing and analysis
├── services/             # Specialized services
│   ├── icon/            # Icon detection and search
│   ├── graph/           # Graph/chart detection
│   └── layout/          # Layout perception
└── utils/               # Utility functions
```

## Dependencies

Core dependencies include:
- PyTorch for deep learning models
- Transformers for AI models
- CLIP for image-text understanding
- FAISS for efficient similarity search
- OpenCV and Pillow for image processing

## License

Part of the widget-factory project.
