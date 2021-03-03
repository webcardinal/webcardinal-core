import { Component, h, Host, Method, Prop } from '@stencil/core';

import { HostElement } from '../../../../decorators';
import { URLHelper } from '../../webc-app-utils';

/**
 * @disable cheatsheet
 */
@Component({
  tag: 'webc-app-menu-item',
})
export class WebcAppMenuItem {
  @HostElement() host: HTMLElement;

  @Prop() menuElement: HTMLElement = null;

  @Prop({ mutable: true }) url: string | null = null;

  @Prop() basePath = '';

  @Prop() item = {
    path: '',
    children: null,
  };

  @Prop({ reflect: true }) level = 0;

  @Prop() name = '';

  @Prop() mode: string;

  @Method()
  async activate() {
    if (['vertical', 'horizontal', 'mobile'].includes(this.mode)) {
      if (this.host.getAttribute('url') === window.location.pathname) {
        let element = this.host;
        element.setAttribute('active', '');

        while (element.tagName.toLowerCase() !== 'webc-app-menu') {
          if (element.classList.contains('dropdown')) {
            element.setAttribute('active', '');
          }
          element = element.parentElement;
        }

        // element is webc-app-menu
        if ('mobile' === this.mode) {
          element.removeAttribute('visible');
          element.removeAttribute('active');
        }
      }
      return;
    }
  }

  @Method()
  async deactivate() {
    this.menuElement.querySelectorAll('webc-app-menu-item').forEach(element => {
      element.removeAttribute('active');

      if ('horizontal' === this.mode) {
        if (typeof element['level'] === 'number' && element['level'] === 0) {
          element.firstElementChild.removeAttribute('active');
        }
      }
    });
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
      const element = dropdown.parentElement;
      if (typeof element['level'] === 'number' && element['level'] !== 0) {
        dropdown.toggleAttribute('active');
      }
      return;
    }

    if ('mobile' === this.mode) {
      const item = e.currentTarget as HTMLElement;
      const dropdown = item.parentElement;
      await this.deactivate();
      dropdown.toggleAttribute('active');
      return;
    }
  }

  async componentWillLoad() {
    if (!this.url) {
      this.url = URLHelper.join(this.basePath, this.item.path).pathname;
    }
    if (this.url === '') {
      this.url = '/';
    }
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
          path: URLHelper.join('', this.item.path, item.path).pathname,
        };
        if (item.children) {
          props.item.children = item.children;
        }
        this.children.push(<webc-app-menu-item {...props} />);
      });
    }
  }

  async componentDidLoad() {
    await this.activate();
  }

  render() {
    if (this.children) {
      return (
        <div class="dropdown">
          <div class="item" onClick={this.handleDropdownClick.bind(this)}>
            {this.name}
          </div>
          <div class="items">{this.children}</div>
        </div>
      );
    }

    return (
      <Host url={this.url}>
        <stencil-route-link class="item" url={this.url}>
          {this.name}
        </stencil-route-link>
      </Host>
    );
  }
}
