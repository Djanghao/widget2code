export function extractResources(widgetDSL) {
  const sfIcons = new Set();
  const reactIcons = new Set();
  const images = new Set();
  const graphs = new Set();

  console.log('[Resource Extract] 🔍 Starting resource extraction from widgetDSL...');

  const GRAPH_COMPONENTS = [
    'BarChart', 'LineChart', 'PieChart', 'RadarChart',
    'StackedBarChart', 'ProgressBar', 'ProgressRing'
  ];

  function traverse(node) {
    if (!node) return;

    if (node.type === 'leaf' && node.component) {
      if (node.component === 'Icon' && node.props?.name) {
        const iconName = node.props.name;
        if (iconName.startsWith('sf:')) {
          sfIcons.add(iconName.replace('sf:', ''));
          console.log(`[Resource Extract] 📦 Found SF icon: ${iconName}`);
        } else if (iconName.includes(':')) {
          reactIcons.add(iconName);
          console.log(`[Resource Extract] 🎨 Found react-icon: ${iconName}`);
        } else {
          sfIcons.add(iconName);
          console.log(`[Resource Extract] 📦 Found SF icon (no prefix): ${iconName}`);
        }
      }

      if (node.component === 'Image' && node.props?.src) {
        images.add(node.props.src);
        console.log(`[Resource Extract] 🖼️  Found image: ${node.props.src}`);
      }

      if (GRAPH_COMPONENTS.includes(node.component)) {
        graphs.add(node.component);
        console.log(`[Resource Extract] 📊 Found graph component: ${node.component}`);
      }
    }

    if (node.type === 'container' && node.children) {
      node.children.forEach(traverse);
    }
  }

  if (widgetDSL?.widget?.root) {
    traverse(widgetDSL.widget.root);
  }

  const result = {
    sfIcons: Array.from(sfIcons),
    reactIcons: Array.from(reactIcons),
    images: Array.from(images),
    graphs: Array.from(graphs)
  };

  console.log(`[Resource Extract] ✅ Extraction complete: ${result.sfIcons.length} SF icons, ${result.reactIcons.length} react-icons, ${result.images.length} images, ${result.graphs.length} graphs`);

  return result;
}
