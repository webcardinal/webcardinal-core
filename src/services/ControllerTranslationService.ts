import { RoutingState } from '../interfaces';
import { getSkinFromState, getSkinPathFromState, loadJSON, URLHelper } from '../utils';

const { join } = URLHelper;

const ControllerTranslationService = {
  loadAndSetTranslationsForPage: async (routingContext: RoutingState): Promise<boolean> => {
    const { basePath, mapping } = routingContext;
    const skin = getSkinFromState();

    if (!window.WebCardinal.translations) {
      window.WebCardinal.translations = {};
    }
    const { translations } = window.WebCardinal;

    let { pathname } = window.location;
    if (pathname.endsWith('/') && pathname !== '/') {
      // trim pathname if ends with "/", except for the corner case when pathname === "/"
      pathname = pathname.slice(0, -1);
    }

    if (translations[skin]?.[pathname]) {
      // the translations are already set for the current skin and page
      return true;
    }

    const source = mapping[pathname];
    if (!source) {
      console.warn(`No HTML page mapping was found for the current pathname: ${pathname}`);
      return false;
    }

    if (source.startsWith('http')) {
      console.warn('Translations for external sources are not supported yet!');
      return false;
    }

    let pathWithoutExtension = source.slice(0, source.lastIndexOf('.'));
    let pathWithExtension = `${pathWithoutExtension}.translate`;

    // check if there is a translation for current skin
    let [error, translationFile] = await loadJSON(join(basePath, getSkinPathFromState(), pathWithExtension).pathname);

    if (!error) {
      if (!translations[skin]) {
        translations[skin] = {};
      }
      translations[skin][pathname] = translationFile;
      return true;
    }

    // only one request for default skin
    if (skin === 'default') {
      return false;
    }

    [error, translationFile] = await loadJSON(join(basePath, pathWithExtension).pathname);

    if (!error) {
      if (!translations['default']) {
        translations['default'] = {};
      }
      translations['default'][pathname] = translationFile;
      return true;
    }

    return false;
  },
};

export default ControllerTranslationService;
