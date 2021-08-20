import { URLHelper } from '../utils';
import { HookType } from './config/types';
import { HOOK_TYPE } from '../constants';

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

    addHook: (type: HookType, tag: string | Function, hook: Function) => {
      let types = Object.values(HOOK_TYPE);
      if (!types.includes(type)) {
        console.error(
          [`Function "addHook": "${type}" is not a valid HookType (values: "${types.join('", "')}")`].join('\n'),
        );
        return;
      }

      let hooks = this.injectedHooks;

      if (this.isConfigLoaded) {
        hooks = window.WebCardinal.hooks;
      }

      if (typeof tag === 'function') {
        hook = tag;
        hooks[type] = hook;
        return;
      }

      if (!tag || typeof tag !== 'string' || typeof hook !== 'function') {
        console.error(
          [
            `Function "addHook" has the following interface:`,
            `"addHook(type: HookType, hook: Function)"`,
            `"addHook(type: HookType, tag: string, hook: Function)"`,
          ].join('\n'),
        );
        return;
      }

      if (!hooks[type]) {
        hooks[type] = {};
      }
      hooks[type][tag as string] = hook;
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

    navigateToUrl: (url: string, state: object) => {
      const { WebCardinal } = window;
      WebCardinal.history.push(url, state);
    },

    navigateToPageTag: async (tag: string, state: object) => {
      return new Promise((resolve, reject) => {
        const { WebCardinal } = window;
        const router = WebCardinal.root.querySelector("webc-app-router");
        router.dispatchEvent(
          new CustomEvent("webcardinal:tags:get", {
            detail: {
              tag,
              callback: (error, path) => {
                if (error) {
                  console.error(error);
                  return reject(error);
                }
                WebCardinal.history.push(path, state);
                resolve(path);
              },
            },
          })
        );
      })
    }
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

    if (typeof this.injectedHooks[HOOK_TYPE.BEFORE_APP] === 'function') {
      await this.injectedHooks[HOOK_TYPE.BEFORE_APP]();
    }
  } catch (error) {
    console.error(error);
  }
}
