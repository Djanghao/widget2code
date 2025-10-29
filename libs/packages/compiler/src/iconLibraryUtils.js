/**
 * Icon Library Utilities
 * Provides support for multiple icon libraries with uniform color prop handling
 */

// Icon library configuration based on the provided mapping
export const ICON_LIBRARIES = {
  // Lucide Icons
  'lucide': {
    importPath: 'lucide-react',
    mapVariable: 'lucideIconsMap',
    colorProp: 'color',
    description: 'Lucide React Icons'
  },

  // Phosphor Icons (weight variants)
  'core-bold': {
    importPath: '@phosphor-icons/react',
    mapVariable: 'phosphorIconsMap',
    colorProp: 'color',
    weight: 'bold',
    description: 'Phosphor Icons Bold'
  },
  'core-duotone': {
    importPath: '@phosphor-icons/react',
    mapVariable: 'phosphorIconsMap',
    colorProp: 'color',
    weight: 'duotone',
    description: 'Phosphor Icons Duotone'
  },
  'core-fill': {
    importPath: '@phosphor-icons/react',
    mapVariable: 'phosphorIconsMap',
    colorProp: 'color',
    weight: 'fill',
    description: 'Phosphor Icons Fill'
  },
  'core-light': {
    importPath: '@phosphor-icons/react',
    mapVariable: 'phosphorIconsMap',
    colorProp: 'color',
    weight: 'light',
    description: 'Phosphor Icons Light'
  },
  'core-regular': {
    importPath: '@phosphor-icons/react',
    mapVariable: 'phosphorIconsMap',
    colorProp: 'color',
    weight: 'regular',
    description: 'Phosphor Icons Regular'
  },
  'core-thin': {
    importPath: '@phosphor-icons/react',
    mapVariable: 'phosphorIconsMap',
    colorProp: 'color',
    weight: 'thin',
    description: 'Phosphor Icons Thin'
  },

  // Heroicons (style variants)
  'heroicons-outline': {
    importPath: '@heroicons/react/24/outline',
    mapVariable: 'heroiconsIconsMap',
    colorProp: 'color',
    description: 'Heroicons Outline'
  },
  'heroicons-solid': {
    importPath: '@heroicons/react/24/solid',
    mapVariable: 'heroicons2IconsMap',
    colorProp: 'color',
    description: 'Heroicons Solid'
  },

  // Ant Design Icons (style variants)
  'ant-design-filled': {
    importPath: '@ant-design/icons',
    mapVariable: 'antDesignIconsMap',
    colorProp: 'color',
    description: 'Ant Design Icons Filled'
  },
  'ant-design-outlined': {
    importPath: '@ant-design/icons',
    mapVariable: 'antDesignIconsMap',
    colorProp: 'color',
    description: 'Ant Design Icons Outlined'
  },
  'ant-design-twotone': {
    importPath: '@ant-design/icons',
    mapVariable: 'antDesignIconsMap',
    colorProp: 'color',
    description: 'Ant Design Icons Two Tone'
  },

  // BoxIcons (type variants)
  'boxicons-logos': {
    importPath: 'boxicons',
    mapVariable: 'boxiconsIconsMap',
    colorProp: 'color',
    description: 'BoxIcons Logos'
  },
  'boxicons-regular': {
    importPath: 'boxicons',
    mapVariable: 'boxiconsIconsMap',
    colorProp: 'color',
    description: 'BoxIcons Regular'
  },
  'boxicons-solid': {
    importPath: 'boxicons',
    mapVariable: 'boxiconsIconsMap',
    colorProp: 'color',
    description: 'BoxIcons Solid'
  },

  // FontAwesome (type variants)
  'font-awesome-brands': {
    importPath: '@fortawesome/react-fontawesome',
    mapVariable: 'fa5IconsMap',
    colorProp: 'style',
    description: 'Font Awesome Brands'
  },
  'font-awesome-regular': {
    importPath: '@fortawesome/react-fontawesome',
    mapVariable: 'fa5IconsMap',
    colorProp: 'style',
    description: 'Font Awesome Regular'
  },
  'font-awesome-solid': {
    importPath: '@fortawesome/react-fontawesome',
    mapVariable: 'fa5IconsMap',
    colorProp: 'style',
    description: 'Font Awesome Solid'
  },

  // Remix Icons (category variants)
  'remix-arrows': {
    importPath: '@remixicon/react',
    mapVariable: 'remixIconsMap',
    colorProp: 'color',
    description: 'Remix Icons Arrows'
  },
  'remix-buildings': {
    importPath: '@remixicon/react',
    mapVariable: 'remixIconsMap',
    colorProp: 'color',
    description: 'Remix Icons Buildings'
  },
  'remix-business': {
    importPath: '@remixicon/react',
    mapVariable: 'remixIconsMap',
    colorProp: 'color',
    description: 'Remix Icons Business'
  },
  'remix-communication': {
    importPath: '@remixicon/react',
    mapVariable: 'remixIconsMap',
    colorProp: 'color',
    description: 'Remix Icons Communication'
  },
  'remix-design': {
    importPath: '@remixicon/react',
    mapVariable: 'remixIconsMap',
    colorProp: 'color',
    description: 'Remix Icons Design'
  },
  'remix-development': {
    importPath: '@remixicon/react',
    mapVariable: 'remixIconsMap',
    colorProp: 'color',
    description: 'Remix Icons Development'
  },
  'remix-device': {
    importPath: '@remixicon/react',
    mapVariable: 'remixIconsMap',
    colorProp: 'color',
    description: 'Remix Icons Device'
  },
  'remix-document': {
    importPath: '@remixicon/react',
    mapVariable: 'remixIconsMap',
    colorProp: 'color',
    description: 'Remix Icons Document'
  },
  'remix-editor': {
    importPath: '@remixicon/react',
    mapVariable: 'remixIconsMap',
    colorProp: 'color',
    description: 'Remix Icons Editor'
  },
  'remix-finance': {
    importPath: '@remixicon/react',
    mapVariable: 'remixIconsMap',
    colorProp: 'color',
    description: 'Remix Icons Finance'
  },
  'remix-food': {
    importPath: '@remixicon/react',
    mapVariable: 'remixIconsMap',
    colorProp: 'color',
    description: 'Remix Icons Food'
  },
  'remix-health-medical': {
    importPath: '@remixicon/react',
    mapVariable: 'remixIconsMap',
    colorProp: 'color',
    description: 'Remix Icons Health & Medical'
  },
  'remix-logos': {
    importPath: '@remixicon/react',
    mapVariable: 'remixIconsMap',
    colorProp: 'color',
    description: 'Remix Icons Logos'
  },
  'remix-map': {
    importPath: '@remixicon/react',
    mapVariable: 'remixIconsMap',
    colorProp: 'color',
    description: 'Remix Icons Map'
  },
  'remix-media': {
    importPath: '@remixicon/react',
    mapVariable: 'remixIconsMap',
    colorProp: 'color',
    description: 'Remix Icons Media'
  },
  'remix-others': {
    importPath: '@remixicon/react',
    mapVariable: 'remixIconsMap',
    colorProp: 'color',
    description: 'Remix Icons Others'
  },
  'remix-system': {
    importPath: '@remixicon/react',
    mapVariable: 'remixIconsMap',
    colorProp: 'color',
    description: 'Remix Icons System'
  },
  'remix-user-faces': {
    importPath: '@remixicon/react',
    mapVariable: 'remixIconsMap',
    colorProp: 'color',
    description: 'Remix Icons User & Faces'
  },
  'remix-weather': {
    importPath: '@remixicon/react',
    mapVariable: 'remixIconsMap',
    colorProp: 'color',
    description: 'Remix Icons Weather'
  },

  // Tabler Icons (style variants)
  'tabler-filled': {
    importPath: '@tabler/icons',
    mapVariable: 'tablerIconsMap',
    colorProp: 'stroke',
    description: 'Tabler Icons Filled'
  },
  'tabler-outline': {
    importPath: '@tabler/icons',
    mapVariable: 'tablerIconsMap',
    colorProp: 'stroke',
    description: 'Tabler Icons Outline'
  },

  // Individual icon libraries
  'circum': {
    importPath: '@klarr-agency/circum-icons-react',
    mapVariable: 'circumIconsMap',
    colorProp: 'color',
    description: 'Circum Icons'
  },
  'css-gg': {
    importPath: 'css.gg',
    mapVariable: 'cssGgIconsMap',
    colorProp: 'fill',
    description: 'CSS.gg Icons'
  },
  'devicons': {
    importPath: 'react-icons/di',
    mapVariable: 'deviconsIconsMap',
    colorProp: 'color',
    description: 'Devicons'
  },
  'feather': {
    importPath: 'feather-icons',
    mapVariable: 'featherIconsMap',
    colorProp: 'stroke',
    description: 'Feather Icons'
  },
  'flat-color': {
    importPath: 'react-icons/fc',
    mapVariable: 'flatColorIconsMap',
    colorProp: null, // No color support for flat color icons
    description: 'Flat Color Icons'
  },
  'grommet': {
    importPath: 'grommet-icons',
    mapVariable: 'grommetIconsMap',
    colorProp: 'color',
    description: 'Grommet Icons'
  },
  'icomoon': {
    importPath: 'react-icons/im',
    mapVariable: 'icomoonFreeIconsMap',
    colorProp: 'fill',
    description: 'IcoMoon Free Icons'
  },
  'icons-lib': {
    importPath: 'react-icons/bs',
    mapVariable: 'bootstrapIconsMap',
    colorProp: 'color',
    description: 'Bootstrap Icons'
  },
  'ionicons': {
    importPath: 'ionicons',
    mapVariable: 'ionicons5IconsMap',
    colorProp: 'color',
    description: 'Ionicons'
  },
  'octicons': {
    importPath: '@primer/octicons-react',
    mapVariable: 'githubOcticonsIconsMap',
    colorProp: 'fill',
    description: 'GitHub Octicons'
  },
  'radix': {
    importPath: '@radix-ui/react-icons',
    mapVariable: 'radixIconsMap',
    colorProp: 'color',
    description: 'Radix Icons'
  },
  'simple-icons': {
    importPath: 'simple-icons',
    mapVariable: 'simpleIconsMap',
    colorProp: 'fill',
    description: 'Simple Icons'
  },
  'simple-line-icons': {
    importPath: 'react-icons/sl',
    mapVariable: 'simpleLineIconsMap',
    colorProp: 'stroke',
    description: 'Simple Line Icons'
  },
  'themify': {
    importPath: 'react-icons/tfi',
    mapVariable: 'themifyIconsMap',
    colorProp: 'stroke',
    description: 'Themify Icons'
  },
  'typicons': {
    importPath: 'react-icons/ti',
    mapVariable: 'typiconsIconsMap',
    colorProp: 'stroke',
    description: 'Typicons'
  },
  'codicons': {
    importPath: 'react-icons/vsc',
    mapVariable: 'vscodeIconsMap',
    colorProp: 'color',
    description: 'VS Code Codicons'
  },
  'weather-icons': {
    importPath: 'react-icons/wi',
    mapVariable: 'weatherIconsIconsMap',
    colorProp: 'color',
    description: 'Weather Icons'
  }
};

/**
 * Parse icon name in format "library-name:icon-name"
 * @param {string} iconName - The icon name to parse
 * @returns {Object} - Parsed icon information
 */
export function parseIconName(iconName) {
  if (!iconName || typeof iconName !== 'string') {
    return { isIcon: false };
  }

  const colonIndex = iconName.indexOf(':');
  if (colonIndex === -1) {
    return { isIcon: false };
  }

  const library = iconName.substring(0, colonIndex);
  const name = iconName.substring(colonIndex + 1);

  if (!ICON_LIBRARIES[library] || !name) {
    return { isIcon: false };
  }

  return {
    isIcon: true,
    library,
    name,
    config: ICON_LIBRARIES[library]
  };
}

/**
 * Convert color prop to library-specific format
 * @param {Object} props - Original props
 * @param {Object} config - Library configuration
 * @returns {Object} - Props with converted color prop
 */
export function convertColorProps(props, config) {
  if (!props.color || !config.colorProp) {
    return props;
  }

  const { color, ...otherProps } = props;
  const colorValue = color;

  switch (config.colorProp) {
    case 'color':
      return { ...otherProps, color: colorValue };

    case 'fill':
      return { ...otherProps, fill: colorValue };

    case 'stroke':
      return { ...otherProps, stroke: colorValue };

    case 'both':
      return { ...otherProps, fill: colorValue, stroke: colorValue };

    case 'style':
      return {
        ...otherProps,
        style: { ...otherProps.style, color: colorValue }
      };

    default:
      return props;
  }
}

/**
 * Generate import statements for used icons
 * @param {Set} usedIcons - Set of used icons with library and name
 * @returns {string} - Import statements string
 */
export function generateIconImports(usedIcons) {
  if (!usedIcons || usedIcons.size === 0) {
    return '';
  }

  // Group icons by library
  const iconsByLibrary = {};
  usedIcons.forEach(icon => {
    const { library, name } = icon;
    if (!iconsByLibrary[library]) {
      iconsByLibrary[library] = new Set();
    }
    iconsByLibrary[library].add(name);
  });

  // Generate import statements
  const importStatements = [];

  Object.entries(iconsByLibrary).forEach(([library, iconNames]) => {
    const config = ICON_LIBRARIES[library];
    if (!config) return;

    const iconNamesArray = Array.from(iconNames).sort();

    // Handle special cases
    if (library.startsWith('font-awesome')) {
      // FontAwesome needs different import structure
      importStatements.push(`import { ${iconNamesArray.join(', ')} } from '${config.importPath}';`);
    } else if (library.startsWith('core-')) {
      // Phosphor icons with weight
      const weight = config.weight || 'regular';
      importStatements.push(`import { ${iconNamesArray.join(', ')} } from '${config.importPath}';`);
      // Note: We'll need to handle weight in the JSX generation
    } else {
      // Standard import
      importStatements.push(`import { ${iconNamesArray.join(', ')} } from '${config.importPath}';`);
    }
  });

  return importStatements.join('\n');
}

/**
 * Generate JSX props string
 * @param {Object} props - Props object
 * @param {number|string} flex - Flex value
 * @param {number|string} width - Width value
 * @param {number|string} height - Height value
 * @returns {string} - Props string for JSX
 */
export function generatePropsString(props, flex, width, height) {
  const propsCode = [];

  // Process all props
  Object.entries(props).forEach(([key, value]) => {
    if (typeof value === 'string') {
      propsCode.push(`${key}="${value}"`);
    } else {
      propsCode.push(`${key}={${JSON.stringify(value)}}`);
    }
  });

  // Add layout props
  if (flex !== undefined) {
    if (typeof flex === 'string') {
      propsCode.push(`flex="${flex}"`);
    } else {
      propsCode.push(`flex={${JSON.stringify(flex)}}`);
    }
  }

  if (width !== undefined) {
    propsCode.push(`width={${JSON.stringify(width)}}`);
  }

  if (height !== undefined) {
    propsCode.push(`height={${JSON.stringify(height)}}`);
  }

  return propsCode.length > 0 ? ' ' + propsCode.join(' ') : '';
}

/**
 * Render icon node as JSX
 * @param {string} library - Library name
 * @param {string} iconName - Icon name
 * @param {Object} props - Component props
 * @param {string} indent - Indentation string
 * @param {Object} layoutProps - Layout props (flex, width, height)
 * @returns {string} - JSX string for the icon
 */
export function renderIconNode(library, iconName, props, indent, layoutProps = {}) {
  const config = ICON_LIBRARIES[library];
  if (!config) {
    throw new Error(`Unknown icon library: ${library}`);
  }

  const { flex, width, height } = layoutProps;

  // Convert color props to library-specific format
  const finalProps = convertColorProps(props, config);

  // Add weight prop for phosphor icons
  if (library.startsWith('core-') && config.weight) {
    finalProps.weight = config.weight;
  }

  // Generate props string
  const propsString = generatePropsString(finalProps, flex, width, height);

  return `${indent}<${iconName}${propsString} />`;
}