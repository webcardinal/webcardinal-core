import { Component, Event, EventEmitter, h, Prop, State } from '@stencil/core';
import { HTMLStencilElement } from '@stencil/core/internal';

import type { RouterHistory } from '@stencil/router';
import { injectHistory } from '@stencil/router';

import { HostElement } from '../../../decorators';
import { promisifyEventEmit } from '../../../utils';

import ApplicationController from '../../../controllers/ApplicationController';

import { subscribeToLogs } from './webc-app-root.utils';
import { CP_WEBC_APP_ROOT_MOBILE_BREAKPOINT, CP_WEBC_APP_ROOT_MODE, HOOK_TYPE } from '../../../constants';

@Component({
  tag: 'webc-app-root',
  styleUrls: {
    default: '../../../styles/webc-app-root/webc-app-root.scss',
  },
  shadow: true,
})
export class WebcAppRoot {
  @HostElement() host: HTMLStencilElement;

  /**
   * Component tag name for a UI loader.
   */
  @Prop() loader = 'webc-spinner';

  /**
   * Path to a JavaScript file which is loaded before configuration from <code>webcardinal.json</code> is applied.<br>
   */
  @Prop() preload: string;

  @State() history: RouterHistory;

  /**
   * LogLevel configuration is received from <code>ApplicationController</code> when this event is fired.<br>
   */
  @Event({
    eventName: 'webcardinal:config:getLogLevel',
    bubbles: true,
    composed: true,
    cancelable: true,
  })
  getLogLevelEvent: EventEmitter;

  private _loaderElement: HTMLElement;

  async componentWillLoad() {
    if (!this.host.isConnected) {
      return;
    }

    if (this.host.parentElement && this.loader) {
      this._loaderElement = document.createElement(this.loader);
      this.host.parentElement.appendChild(this._loaderElement);
    }

    const controller = new ApplicationController(this.host);
    await controller.process(this.preload);

    if (this.host.children.length !== 0) {
      await this.registerAppErrorComponentAndListeners();
      return;
    }

    await this.renderDefault();
  }

  async componentDidLoad() {
    if (this._loaderElement) {
      this._loaderElement.hidden = true;

      // TODO: expose those in other manner
      window.WebCardinal.root = this.host;
      window.WebCardinal.loader = this._loaderElement;
    }

    this.callHook(HOOK_TYPE.AFTER_APP);
  }

  private async renderDefault() {
    const computedStyles = window.getComputedStyle(this.host);
    const initialMode = computedStyles.getPropertyValue(CP_WEBC_APP_ROOT_MODE).trim();

    await this.registerAppErrorComponentAndListeners();

    if (initialMode === 'none') {
      this.host.setAttribute('layout', 'container');
      this.host.append(document.createElement('webc-app-container'));
    } else {
      const breakpoint = computedStyles.getPropertyValue(CP_WEBC_APP_ROOT_MOBILE_BREAKPOINT).trim();
      const mediaQuery = window.matchMedia(`(max-width: ${breakpoint})`);

      const mode = initialMode;
      const mobileMode = 'mobile';

      const elements = {
        menu: Object.assign(document.createElement('webc-app-menu'), {
          mode: initialMode,
        }),
        container: document.createElement('webc-app-container'),
      };
      const mobileElements = {
        menu: Object.assign(document.createElement('webc-app-menu'), {
          mode: mobileMode,
        }),
      };

      if (mediaQuery.matches) {
        this.host.setAttribute('layout', mobileMode);
        this.host.append(mobileElements.menu, elements.container);
      } else {
        this.host.setAttribute('layout', mode);
        this.host.append(elements.menu, elements.container);
      }

      mediaQuery.addEventListener('change', e => {
        if (e.matches) {
          document.documentElement.style.setProperty(CP_WEBC_APP_ROOT_MODE, ` ${mobileMode}`);
          elements.menu.remove();
          this.host.setAttribute('layout', mobileMode);
          this.host.insertBefore(mobileElements.menu, elements.container);
        } else {
          document.documentElement.style.setProperty(CP_WEBC_APP_ROOT_MODE, ` ${initialMode}`);
          mobileElements.menu.remove();
          this.host.setAttribute('layout', initialMode);
          this.host.insertBefore(elements.menu, elements.container);
        }
      });
    }
  }

  private async registerAppErrorComponentAndListeners() {
    this.host.appendChild(document.createElement('webc-app-error-toast'));

    try {
      const logLevel = await promisifyEventEmit(this.getLogLevelEvent);
      subscribeToLogs(logLevel);
    } catch (error) {
      console.error(error);
    }
  }

  private callHook = type => {
    if (!window.WebCardinal.hooks) {
      return;
    }
    const hooks = window.WebCardinal.hooks;
    if (typeof hooks[type] === 'function') {
      hooks[type]();
    }
  };

  render() {
    return <slot />;
  }
}

injectHistory(WebcAppRoot);
