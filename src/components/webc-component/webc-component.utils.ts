import { CUSTOM_ELEMENTS_PATH } from '../../constants';
import { getSkinFromState, getSkinPathFromState, loadHTML, URLHelper } from '../../utils';

const { join } = URLHelper;
const components = {};

export const getTemplate = async (templatePath) => {
  const { basePath } = window.WebCardinal;
  const skin = getSkinFromState();

  if (!components[skin]) {
    components[skin] = {};
  }

  if (components[skin][templatePath]) {
    return components[skin][templatePath];
  }

  // check if there is a template for current skin
  let [error, template] = await loadHTML(join(basePath, getSkinPathFromState(), CUSTOM_ELEMENTS_PATH, templatePath).pathname);

  if (!error) {
    components[skin][templatePath] = template;
    return template;
  }

  // only one request for default skin
  if (skin === 'default') {
    return '';
  }

  if (!components['default']) {
    components['default'] = {};
  }

  if (components['default'][templatePath]) {
    return components['default'][templatePath];
  }

  // if there is no template from skin, fallback is to default skin (root level)
  [error, template] = await loadHTML(join(basePath, CUSTOM_ELEMENTS_PATH, templatePath).pathname);

  if (!error) {
    components['default'][templatePath] = template;
    return template;
  }

  return '';
};
