import type { EventEmitter } from '@stencil/core';
import { Component, Event, h, Prop, State } from '@stencil/core';
import type { RouterHistory } from '@stencil/router';
import { injectHistory } from '@stencil/router';

import { HostElement } from '../../../../decorators';
import { promisifyEventEmit, convertCSSTimeToMs, URLHelper } from '../../../../utils';
import { WebcAppMenuMode } from '../../../../interfaces';

const { trimEnd } = URLHelper;

@Component({
  tag: 'webc-app-menu',
  styleUrls: {
    vertical: '../../../../styles/webc-app-menu/webc-app-menu.vertical.scss',
    horizontal: '../../../../styles/webc-app-menu/webc-app-menu.horizontal.scss',
    mobile: '../../../../styles/webc-app-menu/webc-app-menu.mobile.scss',
  },
})
export class WebcAppMenu {
  @HostElement() host: HTMLElement;

  /**
   * This Array is received from <code>ApplicationController</code>.
   */
  @Prop({ mutable: true }) items = [];

  /**
   * There is the possibility to change the base path of your application, using <code>base</code> HTML Element:
   * <psk-example>
   *   <psk-code>
   *    <base href="/my-custom-base">
   *   </psk-code>
   * </psk-example>
   *
   * Both <code>webc-app-menu</code> and <code>webc-app-router</code> must share the same <code>basePath</code>.
   */
  @Prop({ mutable: true }) basePath = '';

  /**
   * Decides if <code>webc-app-identity</code> is rendered.<br>
   * This property is set by Custom Variable <code>--disable-identity</code>.
   */
  @Prop({ mutable: true, reflect: true }) disableIdentity = false;

  @State() history: RouterHistory;

  private slots = {
    before: false,
    after: false,
  };
  private modes = Object.keys(this._menu);
  private defaultMode = this.modes[0] as WebcAppMenuMode;
  private computedStyles: CSSStyleDeclaration;

  @Prop({ reflect: true, mutable: true }) mode: WebcAppMenuMode = this.defaultMode;

  /**
   * Routing configuration received from <code>ApplicationController</code>.<br>
   * This configuration includes different settings for pages, skins, modals, etc.;
   */
  @Event({
    eventName: 'webcardinal:config:getRouting',
    bubbles: true,
    composed: true,
    cancelable: true,
  })
  getRoutingConfigEvent: EventEmitter;

  private _toggleActiveItem() {
    const selector = `webc-app-menu-item[url="${window.location.pathname}"]`;
    const item = this.host.querySelector(selector) as any;
    if (item) {
      item.deactivate().then(item.activate());
    }
  }

  private _extractItems = items => {
    const indexedItems = [];
    for (const item of items) {
      if (!item.indexed) continue;
      const indexedItem = {
        name: item.name,
        path: item.path,
      } as any;
      if (item.children && item.children.length > 0) {
        indexedItem.children = this._extractItems(item.children);
      }
      indexedItems.push(indexedItem);
    }
    return indexedItems;
  };

  private _renderItem = item => {
    const props = {
      basePath: this.basePath,
      item: {
        path: item.path,
        children: item.children,
      },
      menuElement: this.host,
      mode: this.mode,
      name: item.name,
    };
    return <webc-app-menu-item {...props} />;
  };

  private _renderItems(items = [], itemRenderer = this._renderItem) {
    if (!Array.isArray(items) || items.length === 0) return null;
    return items.map(item => itemRenderer(item));
  }

  async componentWillLoad() {
    if (!this.host.isConnected) {
      return;
    }

    // disable flag for webc-app-identity
    this.computedStyles = window.getComputedStyle(this.host);
    this.disableIdentity = this.computedStyles.getPropertyValue('--disable-identity').trim() === 'true';

    // get routing data
    if (this.items.length === 0) {
      try {
        const routing = await promisifyEventEmit(this.getRoutingConfigEvent);
        this.items = this._extractItems(routing.pages);
        this.basePath = trimEnd(new URL(routing.baseURL).pathname);
      } catch (error) {
        console.error(error);
      }
    }

    // manage modes
    if (!this.modes.includes(this.mode)) {
      console.warn(`You must use one of the following modes: ${this.modes.join(', ')}\n`, `target element:`, this.host);
      this.mode = this.defaultMode;
    }

    // manage slots
    for (const key of Object.keys(this.slots)) {
      if (this.host.querySelector(`[slot=${key}]`)) {
        this.slots[key] = true;
        this.host.classList.add(`slot-${key}`);
      } else {
        this.host.classList.remove(`slot-${key}`);
      }
    }
  }

  private get _menu() {
    const renderMenu = () => {
      return [
        this.slots.before ? (
          <div class="container before">
            <slot name="before" />
          </div>
        ) : null,
        <div class="container content">
          {this.disableIdentity ? null : <webc-app-identity />}
          <div class="app-menu items">{this._renderItems(this.items)}</div>
        </div>,
        this.slots.after ? (
          <div class="container after">
            <slot name="after" />
          </div>
        ) : null,
      ];
    };

    const renderMobileMenu = () => {
      const burgerClicked = () => {
        if (this.host.hasAttribute('active')) {
          this.host.removeAttribute('visible');
          setTimeout(() => {
            this.host.removeAttribute('active');
          }, convertCSSTimeToMs(this.computedStyles.getPropertyValue('--backdrop-transition-delay')) || 200);
        } else {
          this.host.setAttribute('active', '');
          setTimeout(() => {
            this.host.setAttribute('visible', '');
          }, 5);
        }
      };

      return [
        this.slots.before ? (
          <div class="container before">
            <slot name="before" />
          </div>
        ) : null,
        <header>
          {this.disableIdentity ? null : <webc-app-identity />}
          <div class="app-menu-toggle">
            <button class="burger" onClick={burgerClicked.bind(this)}>
              <span class="line" />
              <span class="line" />
              <span class="line" />
            </button>
          </div>
        </header>,
        this.slots.after ? (
          <div class="container after">
            <slot name="after" />
          </div>
        ) : null,
        <div class="app-menu-backdrop">
          <aside class="app-menu items">{this._renderItems(this.items)}</aside>
        </div>,
      ];
    };

    return {
      vertical: renderMenu(),
      horizontal: renderMenu(),
      mobile: renderMobileMenu(),
    };
  }

  render() {
    if (!this.history) return null;
    this.history.listen(this._toggleActiveItem.bind(this));
    return this._menu[this.mode];
  }
}

injectHistory(WebcAppMenu);
