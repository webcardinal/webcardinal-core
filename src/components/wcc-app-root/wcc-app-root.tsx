import { Component, h, Prop } from '@stencil/core';
import { RouterHistory, injectHistory } from '@stencil/router';
import { ApplicationController } from '../../controllers';
import { HostElement } from '../../decorators';
import { ControllerRegistryService } from '../../services';

// TODO: utils function for getting a controller

@Component({
  tag: 'wcc-app-root',
  styleUrls: {
    default: '../../styles/wcc-app-root/wcc-app-root.scss'
  },
  shadow: true
})
export class WccAppRoot {
  @HostElement() host: HTMLElement;

  @Prop({ attribute: 'controller' }) controllerName: string | null;

  @Prop({ attribute: 'loader' }) loaderName: string = 'wcc-spinner';

  @Prop() history: RouterHistory;

  private _loaderElement: HTMLElement;

  async componentWillLoad() {
    if (this.host.parentElement && this.loaderName) {
      this._loaderElement = document.createElement(this.loaderName);
      this.host.parentElement.appendChild(this._loaderElement);
    }

    if (typeof this.controllerName === 'string') {
      try {
        let Controller = await ControllerRegistryService.getController(this.controllerName);

        // Prevent execution if the node has been removed from DOM
        if (this.host.isConnected) {
          new Controller(this.host);
        }
      } catch (error) {
        console.error(error);
      }
    } else if (this.host.isConnected) {
      // load default controller
      new ApplicationController(this.host);
    }

    if (this.host.children.length === 0) {
      this.host.appendChild(document.createElement('wcc-app-menu'));
      this.host.appendChild(document.createElement('wcc-app-container'));
    }
  }

  async componentDidLoad() {
    this._loaderElement.remove();
  }

  render() {
    return <slot/>;
  }
}

injectHistory(WccAppRoot);
