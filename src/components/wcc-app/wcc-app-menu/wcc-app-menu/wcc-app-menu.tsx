import { Component, Event, EventEmitter, h, Prop } from '@stencil/core';
import { injectHistory, RouterHistory } from '@stencil/router';
import { HostElement } from '../../../../decorators';
import { promisifyEventEmit, convertCSSTimeToMs } from '../../../../utils';
import { URLHelper } from '../../wcc-app-utils';

@Component({
  tag: 'wcc-app-menu',
  styleUrls: {
    vertical: '../../../../styles/wcc-app-menu/wcc-app-menu.vertical.scss',
    horizontal: '../../../../styles/wcc-app-menu/wcc-app-menu.horizontal.scss',
    mobile: '../../../../styles/wcc-app-menu/wcc-app-menu.mobile.scss'
  }
})
export class WccAppMenu {
  @HostElement() host: HTMLElement;

  @Prop({ mutable: true }) items = [];

  @Prop({ mutable: true }) basePath: string = '';

  @Prop({ mutable: true, reflect: true }) disableIdentity = false;

  @Prop() history: RouterHistory;

  private slots = {
    before: false,
    after: false
  }
  private modes = Object.keys(this._menu);
  private defaultMode = this.modes[0];
  private computedStyles: CSSStyleDeclaration;

  @Prop({ reflect: true, mutable: true }) mode = this.defaultMode;

  @Event({
    eventName: 'webcardinal:config:getRouting',
    bubbles: true, composed: true, cancelable: true
  }) getRoutingConfigEvent: EventEmitter;

  private _toggleActiveItem() {
    const selector = `[url="${window.location.pathname}"]`;
    const item = this.host.querySelector(selector) as any;
    if (item) {
      item.deactivate().then(item.activate());
    }
  }

  private _extractItems = items => {
    let indexedItems = [];
    for (let item of items) {
      if (!item.indexed) continue;
      let indexedItem = {
        name: item.name,
        path: item.path
      } as any;
      if (item.children && item.children.length > 0) {
        indexedItem.children = this._extractItems(item.children);
      }
      indexedItems.push(indexedItem);
    }
    return indexedItems;
  }

  private _renderItem = item => {
    const props = {
      basePath: this.basePath,
      item: {
        path: item.path,
        children: item.children
      },
      menuElement: this.host,
      mode: this.mode,
      name: item.name
    }
    return <wcc-app-menu-item {...props}/>
  }

  private _renderItems(items = [], itemRenderer = this._renderItem) {
    if (!Array.isArray(items) || items.length === 0) return null;
    return items.map(item => itemRenderer(item));
  }

  async componentWillLoad() {
    // get routing data
    if (this.items.length === 0) {
      try {
        const routing = await promisifyEventEmit(this.getRoutingConfigEvent);
        this.items = this._extractItems(routing.pages);
        this.basePath = URLHelper.trimEnd(new URL(routing.baseURL).pathname);
      } catch (error) {
        console.error(error);
      }
    }

    // manage modes
    if (!this.modes.includes(this.mode)) {
      console.warn(
        `You must use one of the following modes: ${this.modes.join(', ')}\n`,
        `target element:`, this.host
      );
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

    // disable flag for wcc-app-identity
    this.computedStyles = window.getComputedStyle(this.host);
    this.disableIdentity = this.computedStyles.getPropertyValue('--wcc-app-menu-disable-identity').trim() === 'true';
  }

  private get _menu() {
    const renderMenu = () => {
      return [
        ( this.slots.before
          ? <div class="container before">
              <slot name="before"/>
            </div>
          : null
        ),
        <div class="container content">
          { this.disableIdentity ? null : <wcc-app-identity /> }
          <div class="app-menu items">
            { this._renderItems(this.items) }
          </div>
        </div>,
        ( this.slots.after
          ? <div class="container after">
              <slot name="after"/>
            </div>
          : null
        )
      ]
    }

    const renderMobileMenu = () => {
      const burgerClicked = () => {
        if (this.host.hasAttribute('active')) {
          this.host.removeAttribute('visible');
          setTimeout(() => {
            this.host.removeAttribute('active');
          }, convertCSSTimeToMs(this.computedStyles.getPropertyValue('--wcc-app-menu-mobile-backdrop-transition-delay')) || 200)
          console.log(convertCSSTimeToMs(this.computedStyles.getPropertyValue('--wcc-app-menu-mobile-backdrop-transition-delay')) || 200)
        } else {
          this.host.setAttribute('active', '');
          setTimeout(() => {
            this.host.setAttribute('visible', '');
          }, 5)
        }

        // this.host.toggleAttribute('active');
      }

      return [
        ( this.slots.before
            ? <div class="container before">
              <slot name="before"/>
            </div>
            : null
        ),
        <header>
          { this.disableIdentity ? null : <wcc-app-identity /> }
          <div class="app-menu-toggle">
            <button class="burger" onClick={burgerClicked.bind(this)}>
              <span class="line"/>
              <span class="line"/>
              <span class="line"/>
            </button>
          </div>
        </header>,
        ( this.slots.after
            ? <div class="container after">
              <slot name="after"/>
            </div>
            : null
        ),
        <div class="app-menu-backdrop">
          <aside class="app-menu items">
            { this._renderItems(this.items) }
          </aside>
        </div>
      ]
    }

    return {
      vertical: renderMenu(),
      horizontal: renderMenu(),
      mobile: renderMobileMenu()
    }
  }

  render() {
    if (!this.history) return null;
    this.history.listen(this._toggleActiveItem.bind(this));
    return this._menu[this.mode];
  }
}

injectHistory(WccAppMenu);
