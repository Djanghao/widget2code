import React from 'react';
import { WidgetShell } from '@widget-factory/primitives';
import { Text } from '@widget-factory/primitives';

export default function WidgetShellSection() {
  return (
    <section id="widgetshell" style={{ marginBottom: 60, scrollMarginTop: 20 }}>
      <h2 style={{
        fontSize: 28,
        fontWeight: 600,
        marginBottom: 24,
        color: '#f5f5f7',
        borderBottom: '2px solid #3a3a3c',
        paddingBottom: 12
      }}>
        WidgetShell Container Size Rules
      </h2>

      <div id="css-priority" style={{ marginBottom: 32, scrollMarginTop: 80 }}>
        <h3 style={{
          fontSize: 20,
          fontWeight: 600,
          marginBottom: 12,
          color: '#f5f5f7'
        }}>
          CSS Priority Rules
        </h3>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: '#e5e5e7', marginBottom: 16 }}>
          Container sizing precedence in widgetspec:
        </p>
        <ul style={{ fontSize: 15, lineHeight: 1.8, color: '#e5e5e7', marginLeft: 24, marginBottom: 0 }}>
          <li><strong>Explicit width/height</strong> always determine container size when present.</li>
          <li><strong>aspectRatio</strong> never directly sets container size. It is only used by <strong>AutoResize</strong> to calculate and write explicit width/height.</li>
          <li>When <strong>AutoResize</strong> is disabled, <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>aspectRatio</code> is ignored.</li>
          <li>If no width/height are set (and AutoResize does not run), the container size is <strong>content-driven</strong>.</li>
        </ul>
        <p style={{ fontSize: 13, lineHeight: 1.6, color: '#a1a1a6', marginTop: 8 }}>
          Note: <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>WidgetShell</code> does not accept an <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>aspectRatio</code> prop.
        </p>
      </div>

      <div id="examples" style={{ marginBottom: 32, scrollMarginTop: 80 }}>
        <h3 style={{
          fontSize: 20,
          fontWeight: 600,
          marginBottom: 12,
          color: '#f5f5f7'
        }}>
          Examples
        </h3>
        <div style={{
          backgroundColor: '#2c2c2e',
          border: '1px solid #3a3a3c',
          borderRadius: 8,
          padding: 20,
          marginBottom: 0
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #3a3a3c' }}>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#f5f5f7' }}>Properties</th>
                <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#f5f5f7' }}>Result</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #3a3a3c' }}>
                <td style={{ padding: '12px 8px', fontSize: 14, color: '#e5e5e7' }}>
                  <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>width: 200, height: 100, aspectRatio: 1</code>
                </td>
                <td style={{ padding: '12px 8px', fontSize: 14, color: '#e5e5e7' }}>
                  200×100 (rectangle, aspectRatio ignored)
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #3a3a3c' }}>
                <td style={{ padding: '12px 8px', fontSize: 14, color: '#e5e5e7' }}>
                  <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>width: 200, aspectRatio: 1</code>
                </td>
                <td style={{ padding: '12px 8px', fontSize: 14, color: '#e5e5e7' }}>
                  Without AutoResize: width fixed at 200, height content-driven. With AutoResize: becomes 200×200 (height calculated and persisted).
                </td>
              </tr>
              <tr>
                <td style={{ padding: '12px 8px', fontSize: 14, color: '#e5e5e7' }}>
                  <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>aspectRatio: 1</code>
                </td>
                <td style={{ padding: '12px 8px', fontSize: 14, color: '#e5e5e7' }}>
                  Without AutoResize: content-driven (aspectRatio ignored). With AutoResize: width/height computed and persisted to maintain 1:1.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div id="autoresize" style={{ marginBottom: 32, scrollMarginTop: 80 }}>
        <h3 style={{
          fontSize: 20,
          fontWeight: 600,
          marginBottom: 12,
          color: '#f5f5f7'
        }}>
          AutoResize Behavior
        </h3>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: '#e5e5e7', marginBottom: 12 }}>
          AutoResize computes and writes explicit <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>width</code> and <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>height</code>. The <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>aspectRatio</code> prop in widgetspec is treated as an input for this calculation, not a rendering constraint.
        </p>
        <ul style={{ fontSize: 15, lineHeight: 1.8, color: '#e5e5e7', marginLeft: 24, marginBottom: 0 }}>
          <li>Toggle: Editors expose a green <strong>AutoResize</strong> switch (on by default).</li>
          <li>When enabled and the spec has <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>aspectRatio</code> but no <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>width/height</code>, AutoResize runs to compute and persist dimensions.</li>
          <li>If <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>width/height</code> already exist, AutoResize skips; aspectRatio is ignored.</li>
          <li>When disabled, aspectRatio is always ignored; the container uses explicit width/height if present, otherwise content-driven sizing.</li>
          <li>Manual control: use the ratio input (e.g. "16:9" or "1.777") + <em>Auto-Resize</em> button to run AutoResize with that ratio and write dimensions back to the spec (overriding any spec aspectRatio).</li>
          <li>Drag-resize (Presets): the resizer locks proportion only when AutoResize is enabled and the spec has an aspectRatio; otherwise it resizes freely.</li>
        </ul>
      </div>

      <div id="visual-examples" style={{ scrollMarginTop: 80 }}>
        <h3 style={{
          fontSize: 20,
          fontWeight: 600,
          marginBottom: 12,
          color: '#f5f5f7'
        }}>
          Visual Examples
        </h3>
        <div style={{
          backgroundColor: '#2c2c2e',
          border: '1px solid #3a3a3c',
          borderRadius: 8,
          padding: 24,
          marginBottom: 0
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#a1a1a6', marginBottom: 16 }}>Live Widget Examples</div>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <WidgetShell width={200} height={100} backgroundColor="#1a1a1a" borderRadius={16} style={{ padding: 16 }}>
                <Text fontSize={14} color="#fff" fontWeight={600}>200×100</Text>
                <Text fontSize={12} color="#999">Fixed size</Text>
              </WidgetShell>
              <code style={{ fontSize: 11, color: '#a1a1a6', textAlign: 'center' }}>width: 200, height: 100</code>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <WidgetShell width={150} height={150} backgroundColor="#1a1a1a" borderRadius={16} style={{ padding: 16 }}>
                <Text fontSize={14} color="#fff" fontWeight={600}>150×150</Text>
                <Text fontSize={12} color="#999">Square</Text>
              </WidgetShell>
              <code style={{ fontSize: 11, color: '#a1a1a6', textAlign: 'center' }}>width: 150, height: 150</code>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <WidgetShell width={180} height={120} backgroundColor="#1a1a1a" borderRadius={20} style={{ padding: 16 }}>
                <Text fontSize={14} color="#fff" fontWeight={600}>180×120</Text>
                <Text fontSize={12} color="#999">borderRadius: 20</Text>
              </WidgetShell>
              <code style={{ fontSize: 11, color: '#a1a1a6', textAlign: 'center' }}>borderRadius: 20</code>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
