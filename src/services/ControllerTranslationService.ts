import { RoutingState } from '../interfaces';
import { getPathname, getSkinFromState, getSkinPathFromState, loadJSON, URLHelper } from '../utils';

const { join } = URLHelper;

const ControllerTranslationService = {
  loadAndSetTranslationsForPage: async (routingContext: RoutingState, customSrc?: string): Promise<boolean> => {
    const { basePath, mapping } = routingContext;
    const skin = getSkinFromState();

    if (!window.WebCardinal.translations) {
      window.WebCardinal.translations = {};
    }
    const { translations } = window.WebCardinal;
    const pathname = getPathname();

    if (translations[skin]?.[pathname]) {
      // the translations are already set for the current skin and page
      return true;
    }

    let source;
    if (typeof customSrc === 'string') {
      // fallback page will be loaded, prepare translations
      source = customSrc;
    } else {
      source = mapping[pathname];
    }

    if (!source) {
      console.warn(`No HTML page mapping was found for the current pathname: ${pathname}`);
      return false;
    }

    if (source.startsWith('http')) {
      console.warn('Translations for external sources are not supported yet!');
      return false;
    }

    const pathWithoutExtension = source.slice(0, source.lastIndexOf('.'));
    const pathWithExtension = `${pathWithoutExtension}.translate`;

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
  }
};

export default ControllerTranslationService;
