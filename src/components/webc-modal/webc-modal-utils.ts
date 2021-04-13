import { MODALS_PATH } from '../../constants';
import { getSkinForCurrentPage, getSkinPathForCurrentPage, URLHelper } from '../../utils';

const modals = {};
const { join } = URLHelper;

export const getModalTemplate = async template => {
  const { basePath } = window.WebCardinal;
  const skin = getSkinForCurrentPage();

  if (!modals[skin]) {
    modals[skin] = {};
  }

  if (modals[skin][template]) {
    return modals[skin][template];
  }

  const modalPath = join(basePath, getSkinPathForCurrentPage(), MODALS_PATH, `${template}.html`).pathname;

  try {
    const response = await fetch(modalPath);
    const content = await response.text();
    if (!response.ok) {
      throw new Error(content);
    }
    modals[skin][template] = content;
    return content;
  } catch (error) {
    console.warn(`Error while loading "${template}" modal at "${modalPath}"`, error);
    return;
  }
};
