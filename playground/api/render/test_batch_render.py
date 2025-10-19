import asyncio
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from render import get_renderer, shutdown_renderer

with open(Path(__file__).parent.parent.parent / "src/examples/weather-small-light.json", "r") as f:
    example_spec = json.load(f)

async def test_single_render():
    print("Testing single widget render...")

    try:
        renderer = await get_renderer(max_workers=1)

        result = await renderer.render_widget(example_spec, timeout=30000)

        print(f"Success!")
        print(f"Size: {result['width']}x{result['height']}")
        print(f"PNG data length: {len(result['png'])} chars")
        print(f"JSX length: {len(result['jsx'])} chars")

        output_dir = Path(__file__).parent.parent.parent / "output"
        output_dir.mkdir(exist_ok=True)

        import base64
        png_path = output_dir / "test_single.png"
        with open(png_path, 'wb') as f:
            f.write(base64.b64decode(result['png']))

        jsx_path = output_dir / "test_single.jsx"
        with open(jsx_path, 'w') as f:
            f.write(result['jsx'])

        spec_path = output_dir / "test_single.json"
        with open(spec_path, 'w') as f:
            json.dump(result['spec'], f, indent=2)

        print(f"\nOutput saved to {output_dir}/test_single.*")

    except Exception as e:
        print(f"Error: {e}")
        raise
    finally:
        await shutdown_renderer()

async def test_batch_render():
    print("Testing batch widget render...")

    specs = [example_spec for _ in range(3)]

    specs[1] = {
        **specs[1],
        "widget": {
            **specs[1]["widget"],
            "backgroundColor": "#E27A3F",
            "aspectRatio": 1.5
        }
    }

    try:
        renderer = await get_renderer(max_workers=4)

        results = await renderer.render_batch(specs, timeout=30000)

        print(f"\nBatch render completed:")
        for i, result in enumerate(results):
            if result['success']:
                data = result['data']
                print(f"  Widget {i}: {data['width']}x{data['height']}")
            else:
                print(f"  Widget {i}: Failed - {result['error']}")

        output_dir = Path(__file__).parent.parent.parent / "output"
        output_dir.mkdir(exist_ok=True)

        import base64
        for i, result in enumerate(results):
            if result['success']:
                data = result['data']

                png_path = output_dir / f"test_batch_{i}.png"
                with open(png_path, 'wb') as f:
                    f.write(base64.b64decode(data['png']))

                jsx_path = output_dir / f"test_batch_{i}.jsx"
                with open(jsx_path, 'w') as f:
                    f.write(data['jsx'])

                spec_path = output_dir / f"test_batch_{i}.json"
                with open(spec_path, 'w') as f:
                    json.dump(data['spec'], f, indent=2)

        print(f"\nOutput saved to {output_dir}/test_batch_*")

    except Exception as e:
        print(f"Error: {e}")
        raise
    finally:
        await shutdown_renderer()

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "batch":
        asyncio.run(test_batch_render())
    else:
        asyncio.run(test_single_render())
