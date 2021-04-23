import { URLHelper } from '../utils';

export default function getPreloadAPI() {
  return {
    setSkin: (skin: string = 'default') => {
      if (!skin || typeof skin !== 'string') {
        console.warn([
          `Function "setSkin(skin: string)" must receive a string as parameter!`,
          `Example of parameter: "advanced-skin"`
        ].join('\n'));
      }

      this.config.skin = skin;
    },

    addControllers: (controllers: { [controllerName: string]: any }) => {
      if (typeof controllers !== 'object' && !Array.isArray(controllers)) {
        console.warn([
          `Function "addControllers(controllers: object)" must receive an object as parameter!`,
          `Form of parameter: "{ <CONTROLLER_NAME>: <CONTROLLER_CLASS>, ... }"`
        ].join('\n'));
      }

      function isFunction(funcOrClass) {
        const propertyNames = Object.getOwnPropertyNames(funcOrClass);
        return !propertyNames.includes('prototype') || propertyNames.includes('arguments');
      }

      for (let key of Object.keys(controllers)) {
        const controller = controllers[key];
        if (!isFunction(controller)) {
          this.injectedControllers[key] = controller;
        } else {
          console.warn([
            `In function "addControllers(controllers: object)", "${key}" is not a valid WebCardinal Controller!`,
            `It will be ignored!`
          ].join('\n'));
        }
      }
    },

    setConfig: (config: object) => {
      this.config = config;
    },

    getConfig: () => this.config,
  };
}

export async function applyPreloadMiddleware(preloadPath) {
  if (!preloadPath) {
    return;
  }

  if (!preloadPath.endsWith('.js')) {
    preloadPath += '.js';
  }

  try {
    await import(URLHelper.join(this.basePath, preloadPath).pathname);
    console.log('[WebCardinal] Preload middleware was used!');
  } catch (error) {
    console.error(error);
  }
}
