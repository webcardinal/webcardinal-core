import { TEMPLATES_PATH } from '../../constants';
import { getSkinFromState, getSkinPathFromState, loadHTML, URLHelper } from '../../utils';

const { join } = URLHelper;
const templates = {};

export const getTemplate = async templatePath => {
  const { basePath } = window.WebCardinal;
  const skin = getSkinFromState();

  if (!templates[skin]) {
    templates[skin] = {};
  }

  if (templates[skin][templatePath]) {
    return templates[skin][templatePath];
  }

  // check if there is a template for current skin
  let [error, template] = await loadHTML(join(basePath, getSkinPathFromState(), TEMPLATES_PATH, templatePath).pathname);

  if (!error) {
    templates[skin][templatePath] = template;
    return template;
  }

  // only one request for default skin
  if (skin === 'default') {
    return '';
  }

  if (!templates['default']) {
    templates['default'] = {};
  }

  if (templates['default'][templatePath]) {
    return templates['default'][templatePath];
  }

  // if there is no template from skin, fallback is to default skin (root level)
  [error, template] = await loadHTML(join(basePath, TEMPLATES_PATH, templatePath).pathname);

  if (!error) {
    templates['default'][templatePath] = template;
    return template;
  }

  return '';
};
