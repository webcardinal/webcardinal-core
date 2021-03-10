import controllers from '../../base/controllers';
import fetch from '../../base/utils/fetch.js';
import {
  LOG_LEVEL,
  EVENT_CONFIG_GET_ROUTING,
  EVENT_CONFIG_GET_IDENTITY,
  EVENT_CONFIG_GET_LOG_LEVEL,
  EVENT_CONFIG_GET_CORE_TYPE,
  EVENT_CONFIG_GET_DOCS_SOURCE,
} from '../constants';

import defaultConfig from './config/default';

const CONFIG_PATH = 'webcardinal.json';

export default class ApplicationController {
  private readonly baseURL: URL;
  private readonly basePath: URL;
  private readonly configURL: URL;
  private config: Record<string, unknown>;
  private isConfigLoaded: boolean;
  private pendingRequests: [any?];

  private _trimPathname = path => {
    if (path.startsWith('/')) {
      path = path.slice(1);
    }
    if (path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    return path;
  };

  private _initBaseURL() {
    const getBaseElementHref = () => {
      const baseElement = document.querySelector('base');
      if (!baseElement) {
        return null;
      }

      const href = baseElement.getAttribute('href');
      if (!href || href === '/') {
        return null;
      }

      return this._trimPathname(href);
    };
    const getWindowLocation = () => {
      return this._trimPathname(window.location.origin);
    };

    const windowLocation = getWindowLocation();
    const baseHref = getBaseElementHref();

    return baseHref ? new URL(baseHref, windowLocation) : new URL(windowLocation);
  }

  private _initBasePath() {
    const basePath = this._trimPathname(this.baseURL.pathname);
    return basePath.length !== 0 ? '/' + basePath : basePath;
  }

  private _initResourceURL(resource) {
    return new URL(this._trimPathname(this.baseURL.href) + '/' + this._trimPathname(resource));
  }

  private _readConfiguration(callback) {
    const fetchJSON = async path => {
      const response = await fetch(path);
      return response.json();
    };

    const loadConfiguration = async () => {
      try {
        return fetchJSON(this.configURL.href);
      } catch (error) {
        return error;
      }
    };

    loadConfiguration()
      .then(data => callback(null, data))
      .catch(error => callback(error));
  }

  private _prepareConfiguration(rawConfig) {
    const getRaw = item => {
      return rawConfig[item] ? rawConfig[item] : defaultConfig[item];
    };

    const getIdentity = () => {
      const rawIdentity = getRaw('identity');
      const result = {};
      for (const key of Object.keys(defaultConfig.identity)) {
        result[key] = rawIdentity[key] || defaultConfig.identity[key];
      }
      return result;
    };

    const getBaseURL = () => {
      return this._trimPathname(this.baseURL.href);
    };

    const getPages = (baseURL = this.baseURL.href, rawPages = getRaw('pages')) => {
      const pages = [];
      for (const rawPage of rawPages) {
        const page: any = {};

        // page name
        if (typeof rawPage.name !== 'string') {
          console.warn(`An invalid page detected (in "${CONFIG_PATH}")`, rawPage);
          continue;
        }
        if (rawPage.name.includes('/')) {
          console.warn(`Page name must not include '/' (in "${rawPages.name}")`);
          continue;
        }
        page.name = rawPage.name;
        const target = page.name.replace(/\s+/g, '-').toLowerCase();

        // page indexed
        if (typeof rawPage.indexed === 'boolean') {
          page.indexed = rawPage.indexed;
        } else {
          page.indexed = true;
        }

        // page path
        if (typeof rawPage.path === 'string') {
          page.path = rawPage.path;
        } else {
          const path = '/' + target;
          try {
            page.path = '.' + new URL(path, baseURL).pathname;
          } catch (error) {
            console.error(`Pathname "${path}" for "${page.name} can not be converted into a URL!\n`, error);
            continue;
          }
        }

        const hasChildren = Array.isArray(rawPage.children) && rawPage.children.length > 0;

        // page src
        if (typeof rawPage.src === 'string') {
          page.src = rawPage.src;
        } else {
          let src = '/' + target;
          if (!hasChildren) {
            src += '.html';
          }
          try {
            page.src = '.' + new URL(src, baseURL).pathname;
          } catch (error) {
            console.error(`Source "${src}" for "${page.name} can not be converted into a URL!\n`, error);
            continue;
          }
        }

        // page tag
        if (typeof rawPage.tag === 'string') {
          page.tag = rawPage.tag;
        }

        // page loader
        if (typeof rawPage.loader === 'string') {
          page.loader = rawPage.loader;
        }

        // children recursion
        if (hasChildren) {
          page.children = getPages(baseURL, rawPage.children);
        }

        pages.push(page);
      }
      return pages;
    };

    const getPagesFallback = () => {
      const fallback = getPages(this.baseURL.href, [getRaw('pagesFallback')])[0];
      delete fallback.path;
      delete fallback.indexed;
      return fallback;
    };

    const getPathname = source => {
      return '/' + this._trimPathname(getRaw(source));
    };

    const getLogLevel = () => {
      const logLevel = getRaw('logLevel');
      return Object.values(LOG_LEVEL).includes(logLevel) ? logLevel : defaultConfig.logLevel;
    };

    const config: any = {
      identity: getIdentity(),
      routing: {
        baseURL: getBaseURL(),
        pages: getPages(),
        pagesFallback: getPagesFallback(),
        pagesPathname: getPathname('pagesPathname'),
        skinsPathname: getPathname('skinsPathname'),
      },
      logLevel: getLogLevel(),
      docsSource: getRaw('docsSource'),
      theme: getRaw('theme'),
      version: getRaw('version'),
      coreType: 'webcardinal',
    };

    return config;
  }

  private _provideConfiguration(key, callback) {
    if (typeof key === 'function' && typeof callback === 'undefined') {
      callback = key;
      key = undefined;
    }

    if (typeof callback !== 'function') {
      return;
    }

    if (typeof key === 'undefined') {
      return callback(undefined, this.config);
    }

    if (!this.config.hasOwnProperty(key)) {
      return callback(`Config "${key}" does not exists!`);
    }

    return callback(undefined, this.config[key]);
  }

  private _registerListener(key) {
    return event => {
      event.preventDefault();
      event.stopImmediatePropagation();

      let callback;

      if (typeof event.detail === 'function') {
        callback = event.detail;
      } else if (event.detail && typeof event.detail.callback === 'function') {
        callback = event.detail.callback;
      } else {
        return;
      }

      if (this.isConfigLoaded) {
        return this._provideConfiguration(key, callback);
      } else {
        this.pendingRequests.push({ configKey: key, callback });
      }
    };
  }

  constructor(element) {
    this.baseURL = this._initBaseURL();
    this.basePath = this._initBasePath();
    this.configURL = this._initResourceURL(CONFIG_PATH);
    this.config = {};
    this.pendingRequests = [];
    this.isConfigLoaded = false;

    this._readConfiguration((error, rawConfig) => {
      if (error) {
        console.error(error);
        return;
      }

      this.config = this._prepareConfiguration(rawConfig);
      console.log('Application config:', this.config);
      this.isConfigLoaded = true;

      window.WebCardinal = {
        controllers,
        basePath: this.basePath,
        language: 'localStorage' in window ? window.localStorage.getItem('language') || 'en' : 'en',
        translations: {},
      };

      while (this.pendingRequests.length) {
        const request = this.pendingRequests.pop();
        this._provideConfiguration(request.configKey, request.callback);
      }
    });

    // @webcardinal/core
    element.addEventListener(EVENT_CONFIG_GET_ROUTING, this._registerListener('routing'));
    element.addEventListener(EVENT_CONFIG_GET_IDENTITY, this._registerListener('identity'));
    element.addEventListener(EVENT_CONFIG_GET_LOG_LEVEL, this._registerListener('logLevel'));
    element.addEventListener(EVENT_CONFIG_GET_CORE_TYPE, this._registerListener('coreType'));
    element.addEventListener(EVENT_CONFIG_GET_DOCS_SOURCE, this._registerListener('docsSource'));

    // @cardinal/core
    // const cardinal_core_events = [
    //   'getAppVersion',
    //   'needRoutes',
    //   'needMenuItems',
    //   'getUserInfo',
    //   'getHistoryType',
    //   'getModals',
    //   'getTags',
    //   'getConfiguration',
    //   'validateUrl',
    //   'getCustomLandingPage'
    // ];

    // Necessary legacy events
    element.addEventListener('getThemeConfig', this._registerListener('theme'));
  }
}
