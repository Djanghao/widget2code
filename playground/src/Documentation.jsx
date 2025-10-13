import React from 'react';

export default function Documentation() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#1c1c1e',
      color: '#f5f5f7',
      overflow: 'auto'
    }}>
      <div style={{
        maxWidth: '80%',
        margin: '0 auto',
        padding: '40px 24px',
        width: '100%'
      }}>
        <h1 style={{
          fontSize: 32,
          fontWeight: 600,
          marginBottom: 48,
          color: '#f5f5f7'
        }}>
          Guides
        </h1>

        <section style={{ marginBottom: 60 }}>
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

          <div style={{ marginBottom: 32 }}>
            <h3 style={{
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 12,
              color: '#f5f5f7'
            }}>
              CSS Priority Rules
            </h3>
            <p style={{
              fontSize: 15,
              lineHeight: 1.6,
              color: '#e5e5e7',
              marginBottom: 16
            }}>
              When multiple sizing properties are present in widgetspec:
            </p>
            <ul style={{
              fontSize: 15,
              lineHeight: 1.8,
              color: '#e5e5e7',
              marginLeft: 24,
              marginBottom: 0
            }}>
              <li>If <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>width</code>, <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>height</code> and <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>aspectRatio</code> are all set, <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>width</code> and <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>height</code> take priority</li>
              <li><code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>aspectRatio</code> only works when either <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>width</code> or <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>height</code> is not set</li>
            </ul>
          </div>

          <div style={{ marginBottom: 32 }}>
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
                      200×200 (square, height calculated from aspectRatio)
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px 8px', fontSize: 14, color: '#e5e5e7' }}>
                      <code style={{ backgroundColor: '#1c1c1e', padding: '2px 6px', borderRadius: 4 }}>aspectRatio: 1</code>
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: 14, color: '#e5e5e7' }}>
                      Content-sized, maintaining 1:1 aspect ratio
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 style={{
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 12,
              color: '#f5f5f7'
            }}>
              AutoResize Behavior
            </h3>
            <p style={{
              fontSize: 15,
              lineHeight: 1.6,
              color: '#e5e5e7',
              marginBottom: 0
            }}>
              AutoResize sets explicit <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>width</code> and <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>height</code> values (useAutoResize.js:104-105), which means even if <code style={{ backgroundColor: '#2c2c2e', padding: '2px 6px', borderRadius: 4 }}>aspectRatio</code> exists in the spec, it will be overridden by the calculated dimensions.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
