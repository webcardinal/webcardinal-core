import { Component, h, Prop, State } from '@stencil/core';
import { RouterHistory, injectHistory } from '@stencil/router';
import { HostElement } from '../../decorators';
import { ControllerRegistryService, ControllerBindableService } from '../../services';

import DefaultContainerController from '../../../base/controllers/ContainerController';

// TODO: 2-way binding

@Component({
  tag: "wcc-bindable"
})
export class WccBindable {
  @HostElement() private host: HTMLElement;

  @Prop({ attribute: 'controller' }) controllerName: string | null;

  @Prop() history: RouterHistory;

  @State() disconnected: boolean = false;

  private controller;

  async componentWillLoad() {
    if (typeof this.controllerName === 'string') {
      try {
        const Controller = await ControllerRegistryService.getController(this.controllerName);

        // Prevent execution if the node has been removed from DOM
        if (this.host.isConnected) {
          this.controller = new Controller(this.host, this.history);
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      // load default controller
      this.controller = new DefaultContainerController(this.host);
    }

    ControllerBindableService.bindModel(this.host, this.controller);
  }

  render() {
    return <slot/>;
  }
}

injectHistory(WccBindable);
