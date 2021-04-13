import { getSkinForCurrentPage, getSkinPathForCurrentPage, URLHelper } from '../utils';
import { SCRIPTS_PATH } from '../constants';

const { join } = URLHelper;

const ControllerRegistryService = {
  getController: async controller => {
    const { controllers, basePath } = window.WebCardinal;
    const skin = getSkinForCurrentPage();

    if (!controllers[skin]) {
      controllers[skin] = {};
    }

    if (controllers[skin][controller]) {
      return controllers[skin][controller];
    }

    const controllerPath = join(basePath, getSkinPathForCurrentPage(), SCRIPTS_PATH, 'controllers', `${controller}.js`)
      .pathname;

    try {
      const controller = await import(controllerPath);
      return controller.default || controller;
    } catch (error) {
      console.error(error);
      return;
    }
  },
};

export default ControllerRegistryService;
