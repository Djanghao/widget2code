import sys
import json
import asyncio
from pathlib import Path


def main():
    """CLI entry point for widget generation."""
    if len(sys.argv) < 3:
        print("Usage: generate-widget <image-path> <output-path>")
        print("Example: generate-widget input.png output.json")
        sys.exit(1)

    image_path = sys.argv[1]
    output_path = sys.argv[2]

    if not Path(image_path).exists():
        print(f"Error: Image file not found: {image_path}")
        sys.exit(1)

    from widgetdsl_generator import generate_widget_full

    try:
        result = asyncio.run(generate_widget_full(image_path))

        with open(output_path, 'w') as f:
            json.dump(result, f, indent=2)

        print(f"Widget generated successfully: {output_path}")
    except Exception as e:
        print(f"Error generating widget: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
