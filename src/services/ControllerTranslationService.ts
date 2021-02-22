const ControllerTranslationService = {
  loadAndSetTranslationForPage: async routingEvent => {
    const { mapping, skinsPath } = routingEvent;
    const { pathname } = window.location;
    const { language, translations } = window.WebCardinal;

    if (translations[language]?.[pathname]) {
      // the translations are already set for the current language and page
      return;
    }

    const source = mapping[pathname];
    if (!source) {
      console.warn(
        `No HTML page mapping was found for the current pathname: ${pathname}`,
      );
      return;
    }

    if (source.startsWith('http')) {
      console.warn('Translations for external sources are not supported yet!');
      return;
    }

    let pathWithoutExtension = source.slice(0, source.lastIndexOf('.'));
    if (pathWithoutExtension.indexOf('/') !== 0) {
      pathWithoutExtension = `/${pathWithoutExtension}`;
    }

    const translationFilePrefix =
      pathWithoutExtension.indexOf('/') === -1
        ? pathWithoutExtension
        : pathWithoutExtension.substr(
            pathWithoutExtension.lastIndexOf('/') + 1,
          );

    const requestedPath = `${skinsPath}/${language}${pathWithoutExtension}/${translationFilePrefix}.translate.json`;
    try {
      const response = await fetch(requestedPath);
      const translationFile = await response.json();

      if (!translations[language]) {
        translations[language] = {};
      }
      translations[language][pathname] = translationFile;

      return translationFile;
    } catch (error) {
      console.log(
        `Error while loading translation for ${language}: ${requestedPath}`,
        error,
      );
      console.error(error);
      return null;
    }
  },
};

export default ControllerTranslationService;
