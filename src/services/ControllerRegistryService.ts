import { SCRIPTS_PATH } from '../constants';
import { getSkinFromState, getSkinPathFromState, loadJS, URLHelper } from '../utils';

const { join } = URLHelper;

const ControllerRegistryService = {
  getController: async controllerPath => {
    const { controllers, basePath } = window.WebCardinal;
    const skin = getSkinFromState();

    if (!controllers[skin]) {
      controllers[skin] = {};
    }

    if (controllers[skin][controllerPath]) {
      return controllers[skin][controllerPath];
    }

    // check if there is a controller for current skin
    let controller = await loadJS(
      join(basePath, getSkinPathFromState(), SCRIPTS_PATH, 'controllers', controllerPath).pathname,
    );

    if (controller) {
      return controller;
    }

    // only one request for default skin
    if (skin === 'default') {
      return;
    }

    // if there is no controller from skin, fallback is to default skin (root level)
    return await loadJS(join(basePath, SCRIPTS_PATH, 'controllers', controllerPath).pathname);
  },
};

export default ControllerRegistryService;
