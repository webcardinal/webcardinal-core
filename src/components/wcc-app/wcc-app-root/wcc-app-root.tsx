import { Component, h, Prop } from '@stencil/core';
import { RouterHistory, injectHistory } from '@stencil/router';
import { ApplicationController } from '../../../controllers';
import { HostElement } from '../../../decorators';

@Component({
  tag: 'wcc-app-root',
  styleUrls: {
    default: '../../../styles/wcc-app-root/wcc-app-root.scss',
  },
  shadow: true
})
export class WccAppRoot {
  @HostElement() host: HTMLElement;

  @Prop({ attribute: 'loader' }) loaderName: string = 'wcc-spinner';

  @Prop() history: RouterHistory;

  private _loaderElement: HTMLElement;

  async componentWillLoad() {
    if (this.host.parentElement && this.loaderName) {
      this._loaderElement = document.createElement(this.loaderName);
      this.host.parentElement.appendChild(this._loaderElement);
    }

    new ApplicationController(this.host);

    if (this.host.children.length === 0) {
      this.host.appendChild(document.createElement('wcc-app-menu'));
      this.host.appendChild(document.createElement('wcc-app-container'));
    }
  }

  async componentDidLoad() {
    this._loaderElement.remove();
  }

  render() {
    return <slot />;
  }
}

injectHistory(WccAppRoot);
