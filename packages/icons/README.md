# @widget-factory/icons

Convert SF Symbols SVGs to React icon components, export `iconsMap` & `metadata` (for `@widget-factory/primitives` `<Icon />`).

## Usage
- Build: `npm run build:icons`
- Recommended: `<Icon name="cloud.sun.fill" size={24} color="#FF9500" />`
- Direct: `const C = iconsMap['cloud.sun.fill']; return <C />`

## Implementation
- Scan `assets/icons/sf-symbols/`, clean SVGs, normalize `width/height=100%`
- Single-color detection → replace with `currentColor` (enables external coloring)
- Generate to `src/components/`, write `src/map.js` & `src/metadata.json`

Auto-generated files are gitignored: `src/components/`, `src/map.js`, `src/metadata.json`.

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
