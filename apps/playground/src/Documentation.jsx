import React, { useState, useEffect } from 'react';
import Sidebar from './components/Documentation/Sidebar.jsx';
import ArchitectureSection from './components/Documentation/ArchitectureSection.jsx';
import WidgetShellSection from './components/Documentation/WidgetShellSection.jsx';
import IconSystemSection from './components/Documentation/IconSystemSection.jsx';
import ComponentTypesSection from './components/Documentation/ComponentTypesSection.jsx';

export default function Documentation() {
  const [activeSection, setActiveSection] = useState('architecture');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const container = document.querySelector('[data-content-scroll]');
      if (container) {
        const offsetTop = element.offsetTop - container.offsetTop - 80;
        container.scrollTo({ top: offsetTop, behavior: 'smooth' });
      }
      setActiveSection(sectionId);
    }
  };

  useEffect(() => {
    const container = document.querySelector('[data-content-scroll]');
    if (!container) return;

    const handleScroll = () => {
      const sections = [
        'architecture', 'system-overview', 'data-flow', 'autoresize-system', 'component-architecture',
        'widgetshell', 'css-priority', 'examples', 'autoresize', 'visual-examples',
        'icon-system', 'sf-symbols', 'lucide-icons',
        'component-types', 'container-components', 'fixed-size-components', 'image-components'
      ];
      const scrollPosition = container.scrollTop + 100;

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const offsetTop = element.offsetTop - container.offsetTop;
          const offsetHeight = element.offsetHeight;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      backgroundColor: '#1c1c1e',
      color: '#f5f5f7',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <Sidebar
        activeSection={activeSection}
        scrollToSection={scrollToSection}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          style={{
            position: 'fixed',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 32,
            height: 48,
            backgroundColor: '#2c2c2e',
            border: '1px solid #3a3a3c',
            borderLeft: 'none',
            borderRadius: '0 8px 8px 0',
            color: '#f5f5f7',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s ease, width 0.2s ease',
            zIndex: 100,
            outline: 'none',
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#3a3a3c';
            e.currentTarget.style.width = '36px';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2c2c2e';
            e.currentTarget.style.width = '32px';
          }}
          title="Show sidebar"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      <div
        data-content-scroll
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '40px 60px',
          transition: 'margin-left 0.3s ease'
        }}
      >
        <ArchitectureSection />
        <WidgetShellSection />
        <IconSystemSection />
        <ComponentTypesSection />
      </div>
    </div>
  );
}
