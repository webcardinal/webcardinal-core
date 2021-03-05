import { Component, h, Host, Prop, State } from '@stencil/core';

import { HostElement } from '../../../decorators';
import { WebcAppLoaderType } from '../../../interfaces';

@Component({
  tag: 'webc-app-loader',
  shadow: true,
})
export class WebcAppLoader {
  @HostElement() host: HTMLElement;

  /**
   * Source path for a HTML page.
   */
  @Prop() src: string;

  /**
   * Fetch a HTML file and loads inside as normal children or in a wrapped manner.
   */
  @Prop({ mutable: true }) type: WebcAppLoaderType = 'default';

  @State() content: string = null;

  private error = false;

  private async _getContent() {
    try {
      const response = await fetch(this.src);
      this.error = false;
      return await response.text();
    } catch (error) {
      this.error = true;
      throw error;
    }
  }

  async componentWillRender() {
    this._getContent()
      .then(data => (this.content = data))
      .catch(error => console.error(error));
  }

  render() {
    if (this.error) {
      return <h4>{`Page ${this.src} could not be loaded!`}</h4>;
    }

    switch (this.type) {
      case 'iframe': {
        const attributes = {
          frameBorder: 0,
          src: 'data:text/html;charset=utf-8, ' + escape(this.content),
          style: {
            overflow: 'hidden',
            width: '100%',
            height: '100%',
          },
        };
        return <iframe {...attributes} />;
      }
      case 'object': {
        const attributes = {
          data: this.src,
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
        const attributes = {
          style: {
            width: '100%',
            height: '100%',
          },
        };
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
