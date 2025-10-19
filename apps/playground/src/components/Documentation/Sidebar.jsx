import React from 'react';
import NavigationItem from './NavigationItem.jsx';

export default function Sidebar({ activeSection, scrollToSection, collapsed, setCollapsed }) {
  const navigationSections = [
    {
      main: { id: 'architecture', label: 'Architecture' },
      items: [
        { id: 'system-overview', label: 'System Overview' },
        { id: 'data-flow', label: 'Data Flow' },
        { id: 'autoresize-system', label: 'AutoResize System' },
        { id: 'component-architecture', label: 'Component Architecture' }
      ]
    },
    {
      main: { id: 'widgetshell', label: 'WidgetShell Size Rules' },
      items: [
        { id: 'css-priority', label: 'CSS Priority Rules' },
        { id: 'examples', label: 'Examples' },
        { id: 'autoresize', label: 'AutoResize' },
        { id: 'visual-examples', label: 'Visual Examples' }
      ]
    },
    {
      main: { id: 'icon-system', label: 'Icon System' },
      items: [
        { id: 'sf-symbols', label: 'SF Symbols' },
        { id: 'lucide-icons', label: 'Lucide Icons' }
      ]
    },
    {
      main: { id: 'component-types', label: 'Component Types' },
      items: [
        { id: 'container-components', label: 'Container Components' },
        { id: 'fixed-size-components', label: 'Fixed-Size Components' },
        { id: 'image-components', label: 'Image Components' }
      ]
    }
  ];

  return (
    <div style={{
      width: collapsed ? 0 : 240,
      flexShrink: 0,
      backgroundColor: '#202020',
      borderRight: collapsed ? 'none' : '1px solid #333',
      overflowY: 'auto',
      overflowX: 'hidden',
      transition: 'width 0.3s ease',
      opacity: collapsed ? 0 : 1,
      position: 'relative'
    }}>
      {!collapsed && (
        <>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid #333',
            marginBottom: 8
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#f5f5f7' }}>Navigation</span>
            <button
              onClick={() => setCollapsed(true)}
              style={{
                width: 28,
                height: 28,
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: 4,
                color: '#8e8e93',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s ease, color 0.2s ease',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2c2c2e';
                e.currentTarget.style.color = '#f5f5f7';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#8e8e93';
              }}
              title="Hide sidebar"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
          <nav style={{ paddingTop: 8 }}>
            <div style={{ marginBottom: 20 }}>
              {navigationSections.map((section, idx) => (
                <div key={idx}>
                  <NavigationItem
                    id={section.main.id}
                    label={section.main.label}
                    active={activeSection === section.main.id}
                    onClick={scrollToSection}
                    isMainSection={true}
                  />
                  {section.items.map((item) => (
                    <NavigationItem
                      key={item.id}
                      id={item.id}
                      label={item.label}
                      active={activeSection === item.id}
                      onClick={scrollToSection}
                    />
                  ))}
                </div>
              ))}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
