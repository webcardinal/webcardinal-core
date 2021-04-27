import { URLHelper } from '../utils';
import { HookType } from './config/types';

export default function getPreloadAPI() {
  return {
    setSkin: (skin: string = 'default') => {
      if (!skin || typeof skin !== 'string') {
        console.warn(
          [
            `Function "setSkin(skin: string)" must receive a string as parameter!`,
            `Example of parameter: "advanced-skin"`,
          ].join('\n'),
        );
      }

      if (this.isConfigLoaded) {
        window.WebCardinal.state.skin = skin;
        return;
      }

      this.config.skin = skin;
    },

    addControllers: (controllers: { [controllerName: string]: any }) => {
      console.warn('Function "addControllers(controllers: object)" is an experimental!');

      if (this.isConfigLoaded) {
        console.warn(
          [
            `Function "addControllers(controllers: object)" must be called only in preload stage of WebCardinal!`,
            `The configuration was already loaded!`,
          ].join('\n'),
        );
        return;
      }

      if (typeof controllers !== 'object' && !Array.isArray(controllers)) {
        console.warn(
          [
            `Function "addControllers(controllers: object)" must receive an object as parameter!`,
            `Form of parameter: "{ <CONTROLLER_NAME>: <CONTROLLER_CLASS>, ... }"`,
          ].join('\n'),
        );
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
          console.warn(
            [
              `In function "addControllers(controllers: object)", "${key}" is not a valid WebCardinal Controller!`,
              `It will be ignored!`,
            ].join('\n'),
          );
        }
      }
    },

    addHook: (tag: string, type: HookType, hook: Function) => {
      let hooks = this.injectedHooks;

      if (this.isConfigLoaded) {
        hooks = window.WebCardinal.hooks;
      }

      if (!tag || typeof tag !== 'string') {
        console.warn(
          [`Function "addHook(tag: string, when: whenType, hook: Function)" must receive a valid page tag!`].join('\n'),
        );
      }

      if (!hooks[tag]) {
        hooks[tag] = {};
      }

      hooks[tag][type] = hook;
    },

    setConfig: (config: object) => {
      if (this.isConfigLoaded) {
        console.warn(
          [
            `Function "setConfig(config: object)" must be called only in preload stage of WebCardinal!`,
            `The configuration was already loaded!`,
          ].join('\n'),
        );
        return;
      }

      this.config = config;
    },

    getConfig: () => {
      if (this.isConfigLoaded) {
        console.warn(
          [
            `Function "getConfig()" must be called only in preload stage of WebCardinal!`,
            `The configuration was already loaded!`,
          ].join('\n'),
        );
        return;
      }

      return this.config;
    },
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
