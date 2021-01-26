import { Component, h, Host, Prop } from '@stencil/core';
import { HostElement } from '../../../../decorators';
import { URLHelper } from '../../wcc-app-utils';

@Component({
  tag: 'wcc-app-menu-item'
})
export class WccAppMenuItem {
  @HostElement() host: HTMLElement;

  @Prop({ mutable: true }) url: string | null = null;

  @Prop() basePath: string = '';

  @Prop() item = {
    path: '',
    children: null
  };

  @Prop() level: number = 0;

  @Prop() name: string = ''

  private mode: string | null = null;
  private children;

  private _setMode = () => {
    if (!this.mode) {
      let element = this.host.parentElement;
      while (element.tagName.toLowerCase() !== 'wcc-app-menu') {
        element = element.parentElement;
      }
      this.mode = element.getAttribute('mode');
    }
  };

  handleClick(e: MouseEvent) {
    e.preventDefault();
    e.stopImmediatePropagation();

    this._setMode();

    if (this.mode === 'vertical') {
      const item = e.currentTarget as HTMLElement;
      const dropdown = item.parentElement;
      dropdown.toggleAttribute('active');
    }
  };

  async componentWillLoad() {
    if (!this.url) this.url = URLHelper.join(this.basePath, this.item.path).pathname;
    if (this.url === '') this.url = '/';

    if (this.item.children) {
      this.children = [];

      const props = {
        basePath: this.basePath,
        level: this.level + 1,
      } as any;

      this.item.children.forEach(item => {
        props.name = item.name;
        props.item = {
          path: URLHelper.join('', this.item.path, item.path).pathname
        };
        if (item.children) {
          props.item.children = item.children;
        }
        this.children.push(<wcc-app-menu-item {...props}/>);
      });
    }
  }

  render() {
    const dropdown = {
      attributes: {
        class: {
          'dropdown': true,
          [`level-${this.level}`]: true
        }
      }
    };

    return (
      <Host>
        { !this.children
          ? <stencil-route-link data-url={this.url} class="item" url={this.url}>{this.name}</stencil-route-link>
          : (
            <div {...dropdown.attributes}>
              <div class="item" onClick={this.handleClick.bind(this)}>{this.name}</div>
              <div class="items">{this.children}</div>
            </div>
          )
        }
      </Host>
    );
  };
}
