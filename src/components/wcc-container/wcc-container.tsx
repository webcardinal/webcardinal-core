import { Component, h, Prop, State } from '@stencil/core';
import { RouterHistory, injectHistory } from '@stencil/router';

import { HostElement } from '../../decorators';
import { ControllerRegistryService } from '../../services';

import DefaultContainerController from '../../../base/controllers/ContainerController';

@Component({
  tag: "wcc-container"
})
export class WccContainer {
  @HostElement() private host: HTMLElement;

  @Prop({ attribute: 'controller' }) controllerName: string | null;

  @Prop() history: RouterHistory;

  @State() disconnected: boolean = false;

  connectedCallback() {
    this.disconnected = false;
  }
  disconnectedCallback() {
    this.disconnected = true;
  }

  async componentWillLoad() {
    if (typeof this.controllerName === 'string') {
      try {
        const Controller = await ControllerRegistryService.getController(this.controllerName);

        // Prevent execution if the node has been removed from DOM
        if (!this.disconnected) {
          new Controller(this.host, this.history);
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      // load default controller
      new DefaultContainerController(this.host);
    }
  }

  render() {
    return <slot/>;
  }
}

injectHistory(WccContainer);
