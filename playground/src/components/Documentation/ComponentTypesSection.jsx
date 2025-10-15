import React from 'react';
import { Image } from '@widget-factory/primitives';
import { Text } from '@widget-factory/primitives';
import { Icon } from '@widget-factory/primitives';
import { Checkbox } from '@widget-factory/primitives';
import { Sparkline } from '@widget-factory/primitives';

export default function ComponentTypesSection() {
  return (
    <section id="component-types" style={{ marginBottom: 60, scrollMarginTop: 80 }}>
      <h2 style={{
        fontSize: 28,
        fontWeight: 600,
        marginBottom: 24,
        color: '#f5f5f7',
        borderBottom: '2px solid #3a3a3c',
        paddingBottom: 12
      }}>
        Component Types
      </h2>

      <div id="container-components" style={{ marginBottom: 32, scrollMarginTop: 80 }}>
        <h3 style={{
          fontSize: 20,
          fontWeight: 600,
          marginBottom: 12,
          color: '#f5f5f7'
        }}>
          Container Components
        </h3>
        <div style={{
          backgroundColor: '#2c2c2e',
          border: '1px solid #3a3a3c',
          borderRadius: 8,
          padding: 20,
          marginBottom: 0
        }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7', marginBottom: 8 }}>Image</div>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: '#e5e5e7', marginBottom: 12 }}>
              Container component using <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>backgroundImage</code>. Supports children elements overlaid on the image. Use <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>url</code>, <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>width</code>, <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>height</code>, <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>borderRadius</code> props.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <Image
                url="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=120&fit=crop"
                width={120}
                height={80}
                borderRadius={12}
                style={{ border: '1px solid #3a3a3c' }}
              />
              <Image
                url="https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=200&h=120&fit=crop"
                width={120}
                height={80}
                borderRadius={12}
                style={{ border: '1px solid #3a3a3c', display: 'flex', alignItems: 'flex-end', padding: 8 }}
              >
                <Text fontSize={11} color="#fff" fontWeight={600} style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>With overlay</Text>
              </Image>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7', marginBottom: 8 }}>Text</div>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: '#e5e5e7', marginBottom: 12 }}>
              Text container using <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>div</code> element. Supports <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>fontSize</code>, <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>color</code>, <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>align</code>, <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>fontWeight</code>, <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>lineHeight</code> props.
            </p>
            <div style={{ display: 'flex', gap: 16, flexDirection: 'column' }}>
              <Text fontSize={18} color="#fff" fontWeight={600}>Bold Large Text</Text>
              <Text fontSize={14} color="#999" fontWeight={400}>Regular Gray Text</Text>
              <Text fontSize={12} color="#007AFF" align="center">Centered Blue Text</Text>
            </div>
          </div>
        </div>
      </div>

      <div id="fixed-size-components" style={{ marginBottom: 32, scrollMarginTop: 80 }}>
        <h3 style={{
          fontSize: 20,
          fontWeight: 600,
          marginBottom: 12,
          color: '#f5f5f7'
        }}>
          Fixed-Size Components
        </h3>
        <div style={{
          backgroundColor: '#2c2c2e',
          border: '1px solid #3a3a3c',
          borderRadius: 8,
          padding: 20,
          marginBottom: 0
        }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7', marginBottom: 8 }}>Icon</div>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: '#e5e5e7', marginBottom: 12 }}>
              Fixed-size wrapper with <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>width</code> and <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>height</code> set to <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>size</code> prop (default 20px). Uses <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>flex: '0 0 auto'</code> and <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>flexShrink: 0</code> to maintain size.
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Icon name="heart.fill" size={20} color="#FF3B30" />
              <Icon name="heart.fill" size={30} color="#FF3B30" />
              <Icon name="heart.fill" size={40} color="#FF3B30" />
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7', marginBottom: 8 }}>Checkbox</div>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: '#e5e5e7', marginBottom: 12 }}>
              Fixed-size circular checkbox with <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>size</code> prop (default 20px). Shows checkmark when <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>checked</code> is true. Uses <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>color</code> prop for border/fill.
            </p>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Checkbox size={24} checked={false} color="#34C759" />
              <Checkbox size={24} checked={true} color="#34C759" />
              <Checkbox size={24} checked={true} color="#FF3B30" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7', marginBottom: 8 }}>Sparkline</div>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: '#e5e5e7', marginBottom: 12 }}>
              Canvas-based line chart with fixed <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>width</code> and <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>height</code> props. Accepts <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>data</code> array and <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>color</code> prop. Uses device pixel ratio for crisp rendering.
            </p>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <Sparkline width={100} height={40} color="#34C759" data={[10, 20, 15, 25, 30, 22, 35, 40]} />
              <Sparkline width={100} height={40} color="#FF3B30" data={[40, 35, 38, 30, 25, 28, 20, 15]} />
              <Sparkline width={100} height={40} color="#007AFF" data={[20, 22, 24, 23, 25, 30, 28, 32]} />
            </div>
          </div>
        </div>
      </div>

      <div id="image-components" style={{ scrollMarginTop: 80 }}>
        <h3 style={{
          fontSize: 20,
          fontWeight: 600,
          marginBottom: 12,
          color: '#f5f5f7'
        }}>
          Image Components
        </h3>
        <div style={{
          backgroundColor: '#2c2c2e',
          border: '1px solid #3a3a3c',
          borderRadius: 8,
          padding: 20,
          marginBottom: 0
        }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7', marginBottom: 8 }}>MapImage</div>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: '#e5e5e7', margin: 0 }}>
              Uses native <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>img</code> element with <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>objectFit: 'cover'</code>. Does not support children. Use for map images where <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>img</code> element behavior is required.
            </p>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#f5f5f7', marginBottom: 8 }}>AppLogo</div>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: '#e5e5e7', margin: 0 }}>
              Wrapper for app logo images with <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>borderRadius</code> support. Uses native <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>img</code> element with <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>objectFit: 'cover'</code>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
