import { Component, Event, EventEmitter, h, Host, Prop, State, Watch } from '@stencil/core';
import { HTMLStencilElement } from '@stencil/core/internal';

import { HOOK_TYPE, SKINS_PATH } from '../../../constants';
import { HostElement } from '../../../decorators';
import { HookType, RoutingState, WebcAppLoaderType } from '../../../interfaces';
import { ControllerTranslationService } from '../../../services';
import {
  getSkinFromState,
  getTranslationsFromState,
  resolveRoutingState,
  URLHelper
} from '../../../utils';

import { checkPageExistence, loadPageContent } from './webc-app-loader.utils';

const { join } = URLHelper;

@Component({
  tag: 'webc-app-loader',
  shadow: true,
})
export class WebcAppLoader {
  @HostElement() host: HTMLStencilElement;

  @State() content = '';

  private activeSrc;
  private watchSkin = false;
  private skinSet = false;
  private hooks = {};

  /**
   * Source path for a HTML page.
   */
  @Prop({ mutable: true, reflect: true }) src: string;

  /**
   * Source path is prefixed with this path.
   */
  @Prop({ mutable: true, reflect: true }) basePath: string = '/';

  /**
   * Fetch a HTML file and loads inside as normal children or in a wrapper.
   */
  @Prop() loader: WebcAppLoaderType = 'default';

  /**
   * If a skin is set for this page, this property will be set according to <code>webcardinal.json</code>.
   */
  @Prop({ reflect: true, mutable: true }) skin: string = 'default';

  /**
   * Tag of the page set in <code>webcardinal.json</code>.
   */
  @Prop({ reflect: true }) tag: string;

  /**
   * Routing configuration received from <code>webc-app-router</code>.
   */
  @Event({
    eventName: 'webcardinal:routing:get',
    bubbles: true,
    cancelable: true,
    composed: true,
  })
  getRoutingStateEvent: EventEmitter<RoutingState>;

  async componentWillLoad() {
    if (!this.host.isConnected) {
      return;
    }

    await this.activateHooks();
    await this.callHook(HOOK_TYPE.BEFORE_PAGE);
    await this.setSkinContext();
    await this.setPageContent();
    this.updateActivePage();
    this.watchSkin = true;

    if (getTranslationsFromState()) {
      const routingState = await resolveRoutingState(this);
      await ControllerTranslationService.loadAndSetTranslationsForPage(routingState);
    }
  }

  async componentDidLoad() {
    await this.callHook(HOOK_TYPE.AFTER_PAGE);
  }

  async disconnectedCallback() {
    await this.callHook(HOOK_TYPE.CLOSED_PAGE);
  }

  @Watch('skin')
  async skinHandle() {
    if (!this.watchSkin) {
      return;
    }

    if (this.skinSet) {
      this.skinSet = false;
      return;
    }

    this.content = '';
    await this.setSkinContext();
    await this.setPageContent();
    this.updateActivePage();
  }

  private async activateHooks() {
    if (!window.WebCardinal.hooks) {
      return;
    }

    this.hooks = {};
    const { hooks } = window.WebCardinal;
    for (let type of [HOOK_TYPE.BEFORE_PAGE, HOOK_TYPE.AFTER_PAGE, HOOK_TYPE.CLOSED_PAGE]) {
      if (hooks[type]?.[this.tag]) {
        this.hooks[type] = hooks[type][this.tag];
      }
    }
  }

  private async setSkinContext() {
    if (this.src.startsWith('http')) {
      this.activeSrc = this.src;
      return;
    }

    // if a skin is set by the webc-app-router via webcardinal.json for a specific page
    if (this.skin !== 'none') {
      if (this.skin !== 'default') {
        const src = join(this.basePath, SKINS_PATH, this.skin, this.src).pathname;
        if (await checkPageExistence(src)) {
          this.activeSrc = src;
          return;
        }
      }

      this.activeSrc = join(this.basePath, this.src).pathname;
      return;
    }

    // otherwise a preferred skin is loaded
    const preferredSkin = getSkinFromState();
    if (preferredSkin !== 'default') {
      const src = join(this.basePath, SKINS_PATH, preferredSkin, this.src).pathname;
      if (await checkPageExistence(src)) {
        this.activeSrc = src;
        this.skin = preferredSkin;
        this.skinSet = true;
        return;
      }
    }

    // otherwise the fallback is "default" skin
    this.activeSrc = join(this.basePath, this.src).pathname;
    this.skin = 'default';
    this.skinSet = true;
    return;
  }

  private async setPageContent() {
    const src = this.activeSrc;
    const content = await loadPageContent(src);
    if (!content) {
      this.content = `
        <section style="padding: 1rem">
            <h4>Page from <code>${src}</code> could not be loaded!</h4>
            <h5>Current skin is <code>${this.skin}</code></h5>
        </section>
      `;
      return;
    }
    this.content = content;
  }

  private updateActivePage() {
    window.WebCardinal.state.page = {
      loader: this.host,
      src: this.activeSrc,
    };
  }

  private async callHook(type: HookType) {
    if (typeof this.hooks[type] === 'function') {
      await this.hooks[type]();
    }
  }

  render() {
    switch (this.loader) {
      case 'parser': {
        const parser = new DOMParser();
        this.host.append(parser.parseFromString(this.content, 'text/html'));
        const attributes = { style: { width: '100%', height: '100%' } };
        return (
          <Host {...attributes}>
            <slot />
          </Host>
        );
      }
      case 'iframe': {
        const attributes = {
          frameBorder: 0,
          srcDoc: this.content,
          sandbox: 'allow-scripts',
          style: {
            display: 'block',
            overflow: 'hidden',
            width: '100%',
            height: '100%',
          },
        };
        return <iframe {...attributes} />;
      }
      case 'object': {
        const attributes = {
          data: this.activeSrc,
          type: 'text/html',
          style: {
            display: 'block',
            width: '100%',
            height: '100%',
          },
        };
        return <object {...attributes} />;
      }
      default: {
        const attributes = { style: { width: '100%', height: '100%' } };
        this.host.innerHTML = this.content;
        return (
          <Host {...attributes}>
            <slot />
          </Host>
        );
      }
    }
  }
}
