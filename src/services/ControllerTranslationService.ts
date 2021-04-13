import { RoutingState } from '../interfaces';
import { getSkinPathForCurrentPage, URLHelper } from '../utils';

const { join } = URLHelper;

const ControllerTranslationService = {
  loadAndSetTranslationsForPage: async (routingContext: RoutingState): Promise<boolean> => {
    const { basePath, mapping } = routingContext;
    const { state } = window.WebCardinal;

    if (!state) {
      console.error('WebCardinal.state is missing!');
      return false;
    }

    if (!state.activePage || !state.activePage.skin) {
      console.error('No skin found for current page!');
      return false;
    }

    if (!state.activePage.skin.name) {
      return false;
    }

    const skin = state.activePage.skin.name;

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
    if (pathWithoutExtension.indexOf('/') !== 0) {
      pathWithoutExtension = `/${pathWithoutExtension}`;
    }

    const requestedPath = join(basePath, `${getSkinPathForCurrentPage()}${pathWithoutExtension}.translate.json`)
      .pathname;

    try {
      const response = await fetch(requestedPath);
      if (response.ok) {
        const translationFile = await response.json();

        if (!translations[skin]) {
          translations[skin] = {};
        }
        translations[skin][pathname] = translationFile;
        return true;
      }
    } catch (error) {
      console.error(`Error while loading translation for "${skin}" skin: ${requestedPath}`, error);
    }

    state.activePage.skin.translations = false;
    return false;
  },
};

export default ControllerTranslationService;
