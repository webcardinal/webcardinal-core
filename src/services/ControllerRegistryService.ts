const ControllerRegistryService = {
  getController: async controllerName => {
    const { controllers, basePath } = window.WebCardinal;

    if (controllers[controllerName]) {
      return controllers[controllerName];
    }

    try {
      const controller = await import(
        `${basePath}/scripts/controllers/${controllerName}.js`
      );
      return controller.default || controller;
    } catch (error) {
      console.error(error);
      return null;
    }
  },
};

export default ControllerRegistryService;
