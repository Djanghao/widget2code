import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';

library.add(fas, far, fab);

// Create a map similar to react-icons structure
const createIconMap = (iconSet) => {
  const iconMap = {};
  Object.keys(iconSet).forEach(key => {
    const iconName = iconSet[key].iconName;
    if (iconName) {
      iconMap[iconName] = (props) => <FontAwesomeIcon {...props} icon={iconSet[key]} />;
    }
  });
  return iconMap;
};

export const fa5IconsMap = {
  ...createIconMap(fas),
  ...createIconMap(far),
  ...createIconMap(fab)
};