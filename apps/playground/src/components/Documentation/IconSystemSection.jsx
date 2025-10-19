import React from 'react';
import { Icon } from '@widget-factory/primitives';

export default function IconSystemSection() {
  return (
    <section id="icon-system" style={{ marginBottom: 60, scrollMarginTop: 80 }}>
      <h2 style={{
        fontSize: 28,
        fontWeight: 600,
        marginBottom: 24,
        color: '#f5f5f7',
        borderBottom: '2px solid #3a3a3c',
        paddingBottom: 12
      }}>
        Icon System
      </h2>

      <div id="sf-symbols" style={{ marginBottom: 32, scrollMarginTop: 80 }}>
        <h3 style={{
          fontSize: 20,
          fontWeight: 600,
          marginBottom: 12,
          color: '#f5f5f7'
        }}>
          SF Symbols Icons
        </h3>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: '#e5e5e7', marginBottom: 16 }}>
          SF Symbols icons use CSS variable <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>--icon-color</code> for dynamic coloring. The Icon component sets this variable and the SVG references it.
        </p>
        <div style={{
          backgroundColor: '#2c2c2e',
          border: '1px solid #3a3a3c',
          borderRadius: 8,
          padding: 20,
          marginBottom: 16
        }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#a1a1a6', marginBottom: 8 }}>Icon Component (packages/primitives/src/Icon.jsx:20)</div>
            <pre style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#e5e5e7' }}>{`const wrapperStyle = {
  '--icon-color': color,
  width: size,
  height: size,
  ...
}`}</pre>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#a1a1a6', marginBottom: 8 }}>SVG Path (packages/icons/sf-symbols/src/components/Icon00Circle.jsx:8)</div>
            <pre style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#e5e5e7' }}>{`<path fill="var(--icon-color, rgba(255, 255, 255, 0.85))" />`}</pre>
          </div>
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: '#e5e5e7', marginBottom: 16 }}>
          When you pass <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>color</code> prop to Icon, it sets <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>--icon-color</code> which the SVG uses via <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>var(--icon-color)</code>. This allows runtime color changes without modifying SVG source.
        </p>
        <div style={{
          backgroundColor: '#2c2c2e',
          border: '1px solid #3a3a3c',
          borderRadius: 8,
          padding: 24,
          marginBottom: 0
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#a1a1a6', marginBottom: 16 }}>Live Examples</div>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Icon name="heart.fill" size={40} color="#FF3B30" />
              <code style={{ fontSize: 12, color: '#a1a1a6' }}>heart.fill</code>
              <code style={{ fontSize: 11, color: '#666' }}>size: 40</code>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Icon name="star.fill" size={40} color="#FFD60A" />
              <code style={{ fontSize: 12, color: '#a1a1a6' }}>star.fill</code>
              <code style={{ fontSize: 11, color: '#666' }}>size: 40</code>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Icon name="checkmark.circle.fill" size={40} color="#34C759" />
              <code style={{ fontSize: 12, color: '#a1a1a6' }}>checkmark.circle.fill</code>
              <code style={{ fontSize: 11, color: '#666' }}>size: 40</code>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Icon name="cloud.fill" size={40} color="#007AFF" />
              <code style={{ fontSize: 12, color: '#a1a1a6' }}>cloud.fill</code>
              <code style={{ fontSize: 11, color: '#666' }}>size: 40</code>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Icon name="bolt.fill" size={40} color="#FF9500" />
              <code style={{ fontSize: 12, color: '#a1a1a6' }}>bolt.fill</code>
              <code style={{ fontSize: 11, color: '#666' }}>size: 40</code>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Icon name="moon.fill" size={40} color="#BF5AF2" />
              <code style={{ fontSize: 12, color: '#a1a1a6' }}>moon.fill</code>
              <code style={{ fontSize: 11, color: '#666' }}>size: 40</code>
            </div>
          </div>
        </div>
      </div>

      <div id="lucide-icons" style={{ scrollMarginTop: 80 }}>
        <h3 style={{
          fontSize: 20,
          fontWeight: 600,
          marginBottom: 12,
          color: '#f5f5f7'
        }}>
          Lucide Icons
        </h3>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: '#e5e5e7', marginBottom: 16 }}>
          Lucide icons use <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>lucide:</code> prefix (e.g., <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>lucide:home</code>). Color is passed directly as a prop to the Lucide component. SF Symbols icons work without prefix or with <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>sf:</code> prefix.
        </p>
        <div style={{
          backgroundColor: '#2c2c2e',
          border: '1px solid #3a3a3c',
          borderRadius: 8,
          padding: 24,
          marginBottom: 0
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#a1a1a6', marginBottom: 16 }}>Live Examples</div>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Icon name="lucide:home" size={40} color="#FF3B30" />
              <code style={{ fontSize: 12, color: '#a1a1a6' }}>lucide:home</code>
              <code style={{ fontSize: 11, color: '#666' }}>size: 40</code>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Icon name="lucide:settings" size={40} color="#FFD60A" />
              <code style={{ fontSize: 12, color: '#a1a1a6' }}>lucide:settings</code>
              <code style={{ fontSize: 11, color: '#666' }}>size: 40</code>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Icon name="lucide:user" size={40} color="#34C759" />
              <code style={{ fontSize: 12, color: '#a1a1a6' }}>lucide:user</code>
              <code style={{ fontSize: 11, color: '#666' }}>size: 40</code>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Icon name="lucide:mail" size={40} color="#007AFF" />
              <code style={{ fontSize: 12, color: '#a1a1a6' }}>lucide:mail</code>
              <code style={{ fontSize: 11, color: '#666' }}>size: 40</code>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
