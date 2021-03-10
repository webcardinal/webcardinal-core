import type { EventEmitter } from '@stencil/core';
import { Component, Event, h, Prop, State } from '@stencil/core';
import type { RouterHistory } from '@stencil/router';
import { injectHistory } from '@stencil/router';

import { ApplicationController } from '../../../controllers';
import { HostElement } from '../../../decorators';
import { promisifyEventEmit } from '../../../utils';

import { subscribeToLogs } from './webc-app-root-utils';

@Component({
  tag: 'webc-app-root',
  styleUrls: {
    default: '../../../styles/webc-app-root/webc-app-root.scss',
  },
  shadow: true,
})
export class WebcAppRoot {
  @HostElement() host: HTMLElement;

  /**
   * Component tag name (in lowercase) for a UI loader.
   */
  @Prop({ attribute: 'loader' }) loaderName = 'webc-spinner';

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
    if (this.host.parentElement && this.loaderName) {
      this._loaderElement = document.createElement(this.loaderName);
      this.host.parentElement.appendChild(this._loaderElement);
    }

    new ApplicationController(this.host);

    if (this.host.children.length === 0) {
      const computedStyles = window.getComputedStyle(this.host);
      const initialMode = computedStyles
        .getPropertyValue('--webc-app-menu-mode')
        .trim();

      if (initialMode === 'none') {
        this.host.setAttribute('layout', 'container');
        this.host.append(document.createElement('webc-app-container'));
      } else {
        const breakpoint = computedStyles.getPropertyValue(
          '--webc-app-menu-mobile-breakpoint',
        );
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
            document.documentElement.style.setProperty(
              '--webc-app-menu-mode',
              ` ${mobileMode}`,
            );
            elements.menu.remove();
            this.host.setAttribute('layout', mobileMode);
            this.host.insertBefore(mobileElements.menu, elements.container);
          } else {
            document.documentElement.style.setProperty(
              '--webc-app-menu-mode',
              ` ${initialMode}`,
            );
            mobileElements.menu.remove();
            this.host.setAttribute('layout', initialMode);
            this.host.insertBefore(elements.menu, elements.container);
          }
        });
      }
    }

    await this.registerAppErrorComponentAndListeners();
  }

  async componentDidLoad() {
    if (this._loaderElement) {
      // this._loaderElement.remove();
      this._loaderElement.hidden = true;
      window.WebCardinal.root = this.host;
      window.WebCardinal.loader = this._loaderElement;
    }
  }

  render() {
    return <slot />;
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
}

injectHistory(WebcAppRoot);
