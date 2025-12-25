### Container Node
```json
{
  "type": "container",
  "direction": "row" | "col",
  "gap": number,
  "flex": number | "none" | 0 | 1,
  "width": number | string (optional, for layout control),
  "height": number | string (optional, for layout control),
  "alignMain": "start" | "end" | "center" | "between" | "around",
  "alignCross": "start" | "end" | "center" | "stretch",
  "padding": number,
  "backgroundColor": "#hex",
  "borderRadius": number (optional),
  "children": [...]
}
```

**Layout Control**: Containers can have explicit `width` and `height` for precise sizing:
- Use numbers for fixed pixel values: `"width": 120`
- Use strings for percentages: `"width": "50%"`
- Combine with `flex` for responsive layouts

**Creating Circular Containers**: Use `borderRadius` with equal `width` and `height`:
- For circles, set `borderRadius` to half of the size (e.g., `width: 60, height: 60, borderRadius: 30`)
- Or use a large value like `borderRadius: 999` to ensure perfect circles regardless of size
