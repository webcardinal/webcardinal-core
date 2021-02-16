import { Component, h, Prop } from '@stencil/core';
import type { RouterHistory } from '@stencil/router';
import { injectHistory } from '@stencil/router';

import DefaultController from '../../../base/controllers/Controller.js';
import { HostElement } from '../../decorators';
import { ControllerRegistryService } from '../../services';

@Component({
  tag: 'webc-container',
})
export class WebcContainer {
  @HostElement() private host: HTMLElement;

  @Prop({ attribute: 'controller' }) controllerName: string | null;

  @Prop() history: RouterHistory;

  async componentWillLoad() {
    if (typeof this.controllerName === 'string') {
      try {
        const Controller = await ControllerRegistryService.getController(
          this.controllerName,
        );

        // Prevent execution if the node has been removed from DOM
        if (this.host.isConnected) {
          new Controller(this.host, this.history);
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      // load default controller
      new DefaultController(this.host);
    }
  }

  render() {
    return <slot />;
  }
}

injectHistory(WebcContainer);
