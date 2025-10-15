import React from 'react';

const Section = ({ title, children }) => (
  <div style={{ backgroundColor: '#2c2c2e', borderRadius: 12, padding: 24 }}>
    <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: '#f5f5f7' }}>
      {title}
    </h3>
    {children}
  </div>
);

const ComponentItem = ({ name, description, props, note }) => (
  <div>
    <div style={{ fontSize: 14, color: '#f5f5f7', fontWeight: 600, marginBottom: 8 }}>
      <code style={{ color: '#FF9500', backgroundColor: '#3a3a3c', padding: '2px 6px', borderRadius: 4 }}>{name}</code> - {description}
    </div>
    {props && (
      <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
        {props}
      </div>
    )}
    {note && (
      <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
        {note}
      </div>
    )}
  </div>
);

export default function ComponentsTab() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
      <Section title="Flex Usage">
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ fontSize: 13, color: '#98989d' }}>
            Use CSS-like shorthand or longhand. Longhand overrides shorthand.
          </div>
          <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
            Shorthand: flex: 0 | "0 0 auto" | "1 0 auto" | "1 1 auto"
          </div>
          <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
            Longhand: flexGrow / flexShrink / flexBasis (overrides flex)
          </div>
          <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
            Text default: 0 1 auto. Fixed media (Icon/Image/MapImage/AppLogo/Checkbox) default: none (0 0 auto).
          </div>
          <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
            Sparkline uses pixel width/height (no responsive); control size via width/height or parent layout.
          </div>
        </div>
      </Section>

      <Section title="Text Components">
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <ComponentItem
              name="Text"
              description="Title/Heading"
            />
            <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
              Main headings and important text
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
              Props: fontSize (default: 18), color, fontWeight (default: 400), align
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
              Default flex: 0 1 auto. Fill space: flex="1 0 auto".
            </div>
          </div>
          <div>
            <ComponentItem
              name="Text"
              description="Label"
            />
            <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
              Secondary text and labels
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
              Props: fontSize (default: 13), color (#666666), fontWeight (default: 400), align
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
              Default flex: 0 1 auto.
            </div>
          </div>
          <div>
            <ComponentItem
              name="Text"
              description="Metric"
            />
            <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
              Numbers with tabular figures
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
              Props: fontSize (default: 32), color, fontWeight (default: 600), align
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
              Default flex: 0 1 auto.
            </div>
          </div>
        </div>
      </Section>

      <Section title="Media Components">
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <ComponentItem
              name="Icon"
              description="Icon"
            />
            <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
              SF Symbols style icons
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginBottom: 8 }}>
              Props: size (default: 20), color, name (required)
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
              Default flex: none (0 0 auto). Use flex to override if needed.
            </div>
            <div style={{ fontSize: 12, color: '#98989d', marginTop: 12 }}>
              View all icons in the "Icons" tab above.
            </div>
          </div>
          <div>
            <ComponentItem
              name="Image"
              description="Image"
            />
            <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
              Display images from URLs
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
              Props: width (required), height (required), url (required), borderRadius (default: 0)
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
              objectFit: cover, Default flex: none (0 0 auto).
            </div>
          </div>
          <div>
            <ComponentItem
              name="MapImage"
              description="Map Image"
            />
            <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
              Display map images
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
              Props: width (required), height (required), url (required)
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
              objectFit: cover, Default flex: none (0 0 auto).
            </div>
          </div>
          <div>
            <ComponentItem
              name="AppLogo"
              description="App Logo"
            />
            <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
              App icon with first letter
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
              Props: size (default: 20), name (required), backgroundColor (default: #007AFF)
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
              Default flex: none (0 0 auto).
            </div>
          </div>
        </div>
      </Section>

      <Section title="Chart Components">
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <ComponentItem
              name="Sparkline"
              description="Sparkline"
            />
            <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
              Small line chart for trends
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
              Props: width (default: 80), height (default: 40), color (default: #34C759), data (required array)
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
              Uses pixel width/height; not responsive by default. Control layout via parent or width.
            </div>
          </div>
        </div>
      </Section>

      <Section title="Control Components">
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <ComponentItem
              name="Checkbox"
              description="Checkbox"
            />
            <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
              Circular checkbox
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
              Props: size (default: 20), checked (default: false), color (default: #FF3B30)
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
              Default flex: none (0 0 auto).
            </div>
          </div>
        </div>
      </Section>

      <Section title="Layout">
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <ComponentItem
              name="container"
              description="Flex Container"
            />
            <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
              Flexbox layout container
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
              Props: direction (row|col), gap, padding, alignMain (start|end|center|between), alignCross (start|end|center), flex, backgroundColor
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
