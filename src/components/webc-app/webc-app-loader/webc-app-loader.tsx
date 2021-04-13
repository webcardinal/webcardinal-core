import { Component, h, Host, Prop, State, Watch } from '@stencil/core';
import { HTMLStencilElement } from '@stencil/core/internal';

import { HostElement } from '../../../decorators';
import { SKINS_PATH } from '../../../constants';
import { WebcAppLoaderType } from '../../../interfaces';
import { URLHelper } from '../../../utils';

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
   * Decides if translations are enabled for the current loaded page according to <code>webcardinal.json</code>.
   */
  @Prop({ reflect: true, mutable: true }) translations: boolean = false;

  async componentWillLoad() {
    if (!this.host.isConnected) {
      return;
    }

    await this.setSkinContext();
    await this.setPageContent();
    this.updateActivePage();
    this.watchSkin = true;
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

  private async setSkinContext() {
    // if a skin is set by the webc-app-router via webcardinal.json for a specific page
    if (this.skin !== 'none') {
      if (this.skin.toLowerCase() !== 'default') {
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
    const preferredSkin = this.getPreferredSkin();
    if (preferredSkin) {
      if (preferredSkin.name.toLowerCase() !== 'default') {
        const src = join(this.basePath, SKINS_PATH, preferredSkin.name, this.src).pathname;
        if (await checkPageExistence(src)) {
          this.activeSrc = src;
          this.skin = preferredSkin.name;
          this.skinSet = true;
          return;
        }
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
    window.WebCardinal.state.activePage = {
      skin: {
        name: this.skin,
        translations: this.translations,
      },
      src: this.src,
      loader: this.host,
    };
  }

  private getPreferredSkin() {
    let preferredSkin;
    if (window.WebCardinal && window.WebCardinal.state && window.WebCardinal.state.activeSkin) {
      preferredSkin = window.WebCardinal.state.activeSkin;
    } else {
      console.error('"activeSkin" can not be found in WebCardinal.state!');
      return;
    }
    if (!preferredSkin.name) {
      console.error('A valid WebCardinal skin must have a name!');
      return;
    }
    return preferredSkin;
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
