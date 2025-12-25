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
          <div>
            <ComponentItem
              name="LineChart"
              description="Line Chart"
            />
            <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
              Full-featured line chart using ECharts
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
              Props: data (array of series), xAxis, width, height, color, showGrid, showLegend
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
              Responsive by default. Uses SVG renderer for crisp exports.
            </div>
          </div>
          <div>
            <ComponentItem
              name="BarChart"
              description="Bar Chart"
            />
            <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
              Vertical or horizontal bar chart
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
              Props: data (array), categories, width, height, color, orientation (vertical|horizontal)
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
              Supports multiple series. Uses ECharts SVG renderer.
            </div>
          </div>
          <div>
            <ComponentItem
              name="StackedBarChart"
              description="Stacked Bar Chart"
            />
            <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
              Stacked bar chart for comparing parts to whole
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
              Props: data (array of series), categories, width, height, colors, showLegend
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
              Each series stacks on top of previous. Uses ECharts.
            </div>
          </div>
          <div>
            <ComponentItem
              name="RadarChart"
              description="Radar Chart"
            />
            <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
              Spider/radar chart for multivariate data
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
              Props: data (array of series), indicators (array of axis configs), width, height, color
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
              Good for showing performance across multiple dimensions.
            </div>
          </div>
          <div>
            <ComponentItem
              name="PieChart"
              description="Pie Chart"
            />
            <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
              Pie or donut chart for proportions
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
              Props: data (array of {'{name, value}'}), width, height, colors, radius, showLabel
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
              Set radius to array like [40, 70] for donut chart.
            </div>
          </div>
        </div>
      </Section>

      <Section title="Progress Components">
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <ComponentItem
              name="ProgressBar"
              description="Progress Bar"
            />
            <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
              Linear progress indicator with multiple styles
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
              Props: value (0-100), max, min, color, backgroundColor, height, width
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
              Additional: variant (default|success|warning|error), size (small|medium|large), animated, striped
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
              orientation (horizontal|vertical), showLabel, labelPosition (center|end|top)
            </div>
          </div>
          <div>
            <ComponentItem
              name="ProgressRing"
              description="Progress Ring"
            />
            <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
              Circular progress indicator
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
              Props: percentage (0-100), color, backgroundColor, size (default: 80), strokeWidth (default: 6)
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
              Can display icon or text: iconName, iconSize, iconColor, content, textColor, fontSize
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
              Default flex: none (0 0 auto).
            </div>
          </div>
        </div>
      </Section>

      <Section title="Control Components">
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <ComponentItem
              name="Button"
              description="Button"
            />
            <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
              Interactive button with icon or text
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
              Props: content (text), icon (icon name), backgroundColor, color, borderColor, borderRadius
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
              Additional: fontSize, fontWeight, padding, paddingX, paddingY, width, height
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
              Use either icon or content, not both. Default flex: 0 0 auto.
            </div>
          </div>
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
          <div>
            <ComponentItem
              name="Slider"
              description="Slider"
            />
            <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
              Horizontal slider control
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
              Props: value (0-100), enabled (default: true), color, thumbColor, width, height, thumbSize
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
              Static visual only (no interaction). Shows current value position.
            </div>
          </div>
          <div>
            <ComponentItem
              name="Switch"
              description="Switch"
            />
            <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
              iOS-style toggle switch
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
              Props: on (default: false), onColor (default: #34C759), offColor, thumbColor, width, height
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
              Static visual only (no interaction). Shows on/off state.
            </div>
          </div>
        </div>
      </Section>

      <Section title="Visual Components">
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <ComponentItem
              name="Divider"
              description="Divider"
            />
            <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
              Horizontal or vertical dividing line
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
              Props: orientation (horizontal|vertical), type (solid|dashed), color, thickness (default: 1)
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
              Default flex: 0 0 auto (doesn't shrink).
            </div>
          </div>
          <div>
            <ComponentItem
              name="Indicator"
              description="Indicator"
            />
            <div style={{ fontSize: 13, color: '#98989d', marginBottom: 8 }}>
              Vertical colored indicator bar
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace' }}>
              Props: color (required), thickness (default: 4), height (default: 100%)
            </div>
            <div style={{ fontSize: 12, color: '#6e6e73', fontFamily: 'Monaco, monospace', marginTop: 4 }}>
              Useful for category/status indication. Default flex: 0 0 auto.
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
