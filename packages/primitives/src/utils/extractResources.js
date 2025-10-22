export function extractResources(widgetSpec) {
  const icons = new Set();
  const images = new Set();

  console.log('[Resource Extract] 🔍 Starting resource extraction from widgetSpec...');

  function traverse(node) {
    if (!node) return;

    if (node.type === 'leaf' && node.component) {
      if (node.component === 'Icon' && node.props?.name) {
        const iconName = node.props.name;
        if (iconName.startsWith('sf:')) {
          icons.add(iconName.replace('sf:', ''));
          console.log(`[Resource Extract] 📦 Found SF icon: ${iconName}`);
        }
      }

      if (node.component === 'Image' && node.props?.src) {
        images.add(node.props.src);
        console.log(`[Resource Extract] 🖼️  Found image: ${node.props.src}`);
      }
    }

    if (node.type === 'container' && node.children) {
      node.children.forEach(traverse);
    }
  }

  if (widgetSpec?.widget?.root) {
    traverse(widgetSpec.widget.root);
  }

  const result = {
    icons: Array.from(icons),
    images: Array.from(images)
  };

  console.log(`[Resource Extract] ✅ Extraction complete: ${result.icons.length} icons, ${result.images.length} images`);

  return result;
}
