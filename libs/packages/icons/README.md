# @widget-factory/icons

Icon library supporting both SF Symbols and Lucide icons. Exports `sfIconsMap` and `lucideIconsMap` (consumed by `@widget-factory/primitives` `<Icon />`).

## Usage

### SF Symbols (default)
```jsx
<Icon name="cloud.sun.fill" size={24} color="#FF9500" />
<Icon name="sf:house.fill" size={20} color="#007AFF" />
```

### Lucide Icons
```jsx
<Icon name="lucide:Sun" size={24} color="#FFD700" />
<Icon name="lucide:Heart" size={20} color="#FF3B30" />
```

## Icon Naming Rules
- **SF Symbols**: `sf:icon.name` or `icon.name` (no prefix defaults to SF)
  - Use lowercase with dots: `house.fill`, `bolt.fill`, `calendar`
- **Lucide**: `lucide:IconName` (prefix required)
  - Use PascalCase: `Sun`, `Moon`, `ArrowRight`, `ChevronDown`

## Structure
```
packages/icons/
├── sf-symbols/          # SF Symbols icons
│   ├── scripts/         # Generation scripts
│   └── src/            # Generated React components
├── lucide/             # Lucide icons
│   └── src/            # Thin wrapper around lucide-react
└── src/                # Main exports
    └── index.jsx       # Exports both icon libraries
```

## SF Symbols - Dynamic Colors
- Icons use CSS variable `--icon-color` for fills/strokes.
- Default color: `rgba(255, 255, 255, 0.85)`.
- `<Icon />` sets `--icon-color` via its `color` prop.

## SF Symbols - Build Process
- One-time prepare: `npm run prepare:dynamic` (only when refreshing source SVGs)
  - Converts multicolor SF Symbols to use `var(--icon-color, rgba(255, 255, 255, 0.85))`.
- Source: `assets/icons/sf-symbols-dynamic/`
- Generation: `npm run build:icons`
  - Normalizes SVGs, generates React components
  - Outputs to `sf-symbols/src/`

## Lucide Icons
- Uses `lucide-react` package directly (no generation needed)
- All Lucide icons are available dynamically
- Tree-shaking supported

## Common SF Symbols for iOS Widgets

### Weather Widget Icons
- `moon.fill`, `moon` - moon icons
- `moon.stars.fill` - moon with stars
- `sun.max.fill`, `sun.max` - sun (maximum)
- `cloud.fill`, `cloud` - cloud
- `cloud.moon.bolt.fill` - cloud + moon + lightning
- `cloud.drizzle.fill` - drizzle
- `cloud.heavyrain.fill` - heavy rain
- `cloud.bolt.rain.fill` - thunderstorm

### Calendar Widget Icons
- `1.calendar` ~ `31.calendar` - calendar date icons
- `1.circle.fill`, `1.circle` ~ `31.circle.fill` - circular numbers

### Reminders Widget Icons
- `circle` - empty circle (uncompleted)
- `circle.fill` - filled circle (completed)
- `record.circle.fill`, `record.circle` - record circle

### Notes Widget Icons
- `folder.fill`, `folder` - folder
- `folder.badge.plus` - folder with plus badge

### Navigation Icons
- `chevron.right`, `chevron.left` - right/left chevron
- `chevron.up`, `chevron.down` - up/down chevron
- `arrow.up`, `arrow.down` - arrows
- `arrow.clockwise` - clockwise arrow
- `location.fill`, `location` - location pin
- `location.circle.fill` - circular location
