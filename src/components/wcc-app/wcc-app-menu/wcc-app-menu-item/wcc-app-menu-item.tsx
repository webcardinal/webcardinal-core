import { Component, h, Host, Method, Prop } from '@stencil/core';
import { HostElement } from '../../../../decorators';
import { URLHelper } from '../../wcc-app-utils';

@Component({
  tag: 'wcc-app-menu-item'
})
export class WccAppMenuItem {
  @HostElement() host: HTMLElement;

  @Prop() menuElement: HTMLElement = null;

  @Prop({ mutable: true, reflect: true }) url: string | null = null;

  @Prop() basePath: string = '';

  @Prop() item = {
    path: '',
    children: null
  };

  @Prop() level: number = 0;

  @Prop() name: string = '';

  @Prop() mode: string;

  @Method()
  async activate() {
    // manage active menu item
    if ('vertical' === this.mode) {
      if (this.url === window.location.pathname) {
        let element = this.host;
        element.setAttribute('active', '');

        while (element.tagName.toLowerCase() !== 'wcc-app-menu') {
          if (element.classList.contains('dropdown')) {
            element.setAttribute('active', '');
          }
          element = element.parentElement;
        }
      }
      return;
    }

    if ('horizontal' === this.mode) {
      if (this.url === window.location.pathname) {
        let element = this.host;
        element.setAttribute('active', '');

        while (element.tagName.toLowerCase() !== 'wcc-app-menu') {
          if (element.classList.contains('dropdown')) {
            element.setAttribute('active', '');
          }
          element = element.parentElement;
        }
      }
      return;
    }
  }

  @Method()
  async deactivate() {
    this.menuElement
      .querySelectorAll('wcc-app-menu-item')
      .forEach(element => {
        element.removeAttribute('active');

        if ('horizontal' === this.mode && element.firstElementChild) {
          if (element.firstElementChild.classList.contains('level-0')) {
            element.firstElementChild.removeAttribute('active');
          }
        }
      })
  }

  private children;

  async handleDropdownClick(e: MouseEvent) {
    e.preventDefault();
    e.stopImmediatePropagation();

    if ('vertical' === this.mode) {
      const item = e.currentTarget as HTMLElement;
      const dropdown = item.parentElement;
      await this.deactivate();
      dropdown.toggleAttribute('active');
      return;
    }

    if ('horizontal' === this.mode) {
      const item = e.currentTarget as HTMLElement;
      const dropdown = item.parentElement;
      if (!dropdown.classList.contains('level-0')) {
        dropdown.toggleAttribute('active');
      }
      return;
    }
  };

  async componentWillLoad() {
    if (!this.url) this.url = URLHelper.join(this.basePath, this.item.path).pathname;
    if (this.url === '') this.url = '/';

    if (this.item.children) {
      this.children = [];

      const props = {
        basePath: this.basePath,
        menuElement: this.menuElement,
        mode: this.mode,
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

  async componentDidLoad() {
    await this.activate();
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
          ? (
            <stencil-route-link class="item" url={this.url}>{this.name}</stencil-route-link>
          )
          : (
            <div {...dropdown.attributes}>
              <div class="item" onClick={this.handleDropdownClick.bind(this)}>{this.name}</div>
              <div class="items">{this.children}</div>
            </div>
          )
        }
      </Host>
    );
  };
}
