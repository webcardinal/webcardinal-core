const ControllerRegistryService = {
  getController: async (controllerName) => {
    const { controllers, baseURL } = window.WebCardinal;

    if (controllers[controllerName]) {
      return controllers[controllerName];
    }

    let resourcePath = `scripts/controllers/${controllerName}.js`;
    let basePath = baseURL.href;
    let separator = basePath[basePath.length - 1] === '/' ? '' : '/';
    resourcePath = basePath + separator + resourcePath;

    try {
      let controller = await import(resourcePath);
      return controller.default || controller;
    } catch (error) {
      console.error(error);
      return null;
    }
  }
}

export default ControllerRegistryService;
