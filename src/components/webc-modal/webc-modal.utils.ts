import { MODALS_PATH } from '../../constants';
import { getSkinFromState, getSkinPathFromState, loadHTML, URLHelper } from '../../utils';

const modals = {};
const { join } = URLHelper;

export const getModalTemplate = async templatePath => {
  const { basePath } = window.WebCardinal;
  const skin = getSkinFromState();

  if (!modals[skin]) {
    modals[skin] = {};
  }

  if (modals[skin][templatePath]) {
    return modals[skin][templatePath];
  }

  // check if there is a modal for current skin
  let [error, modal] = await loadHTML(join(basePath, getSkinPathFromState(), MODALS_PATH, templatePath).pathname);

  if (!error) {
    modals[skin][templatePath] = modal;
    return modal;
  }

  // only one request for default skin
  if (skin === 'default') {
    return '';
  }

  if (!modals['default']) {
    modals['default'] = {};
  }

  if (modals['default'][templatePath]) {
    return modals['default'][templatePath];
  }

  // if there is no modal from skin, fallback is to default skin (root level)
  [error, modal] = await loadHTML(join(basePath, MODALS_PATH, templatePath).pathname);

  if (!error) {
    modals['default'][templatePath] = modal;
    return modal;
  }

  return '';
};
