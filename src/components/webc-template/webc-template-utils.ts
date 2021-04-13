import { TEMPLATES_PATH } from '../../constants';
import { getSkinForCurrentPage, getSkinPathForCurrentPage, URLHelper } from '../../utils';

const { join } = URLHelper;
const templates = {};

export const getTemplate = async template => {
  const { basePath } = window.WebCardinal;
  const skin = getSkinForCurrentPage();

  if (!templates[skin]) {
    templates[skin] = {};
  }

  if (templates[skin][template]) {
    return templates[skin][template];
  }

  const templatePath = join(basePath, getSkinPathForCurrentPage(), TEMPLATES_PATH, `${template}.html`).pathname;

  try {
    const response = await fetch(templatePath);
    const content = await response.text();
    if (!response.ok) {
      throw new Error(content);
    }
    templates[skin][template] = content;
    return content;
  } catch (error) {
    console.warn(`Error while loading "${template}" template at "${templatePath}"`, error);
    return;
  }
};
