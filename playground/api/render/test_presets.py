import asyncio
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

from render import get_renderer, shutdown_renderer

PRESETS = [
    "weather-small-light.json",
    "weather-medium-dark.json",
    "weather-large-light.json",
    "notes-small-light.json",
    "notes-small-dark.json",
    "calendar-small-light.json",
    "calendar-small-dark.json",
    "calendar-medium-light.json",
    "battery-small-dark.json",
    "battery-medium-light.json",
]

async def test_multiple_presets():
    print(f"Testing {len(PRESETS)} different widget presets...")
    print("=" * 70)

    specs = []
    preset_names = []

    for preset in PRESETS:
        path = Path(__file__).parent.parent.parent / f"src/examples/{preset}"
        try:
            with open(path, "r") as f:
                specs.append(json.load(f))
                preset_names.append(preset)
        except FileNotFoundError:
            print(f"⚠️  Skipping {preset} (not found)")

    try:
        renderer = await get_renderer(max_workers=4)

        results = await renderer.render_batch(specs, timeout=90000)

        print(f"\n✅ Batch render completed!")
        print("=" * 70)

        success_count = 0
        fail_count = 0

        for i, result in enumerate(results):
            preset_name = preset_names[i].replace('.json', '')
            if result['success']:
                data = result['data']
                size = f"{data['width']}x{data['height']}"
                print(f"✓ {preset_name:30s} → {size:10s}")
                success_count += 1
            else:
                error_msg = result['error'][:50] + "..." if len(result['error']) > 50 else result['error']
                print(f"✗ {preset_name:30s} → {error_msg}")
                fail_count += 1

        output_dir = Path(__file__).parent.parent.parent.parent / "output"
        output_dir.mkdir(exist_ok=True)

        import base64
        for i, result in enumerate(results):
            if result['success']:
                data = result['data']
                name = preset_names[i].replace('.json', '')

                png_path = output_dir / f"{name}.png"
                with open(png_path, 'wb') as f:
                    f.write(base64.b64decode(data['png']))

                jsx_path = output_dir / f"{name}.jsx"
                with open(jsx_path, 'w') as f:
                    f.write(data['jsx'])

                spec_path = output_dir / f"{name}.json"
                with open(spec_path, 'w') as f:
                    json.dump(data['spec'], f, indent=2)

        print("=" * 70)
        print(f"\n📊 Summary: {success_count} succeeded, {fail_count} failed")
        print(f"📁 Output saved to: {output_dir}/")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await shutdown_renderer()

if __name__ == "__main__":
    asyncio.run(test_multiple_presets())
