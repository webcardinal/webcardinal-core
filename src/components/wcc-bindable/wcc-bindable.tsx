import { Component, h, Method, Prop } from '@stencil/core';
import { RouterHistory, injectHistory } from '@stencil/router';
import { HostElement } from '../../decorators';
import {
  ComponentListenersService,
  ControllerRegistryService,
  ControllerBindingService
} from '../../services'

import DefaultController from '../../../base/controllers/Controller.js';

@Component({
  tag: "wcc-bindable"
})
export class WccBindable {
  @HostElement() private host: HTMLElement;

  @Prop({ attribute: 'controller' }) controllerName: string | null;

  @Prop() history: RouterHistory;

  private controller;
  private model;
  private listeners: ComponentListenersService;

  async componentWillLoad() {
    // load controller
    if (typeof this.controllerName === 'string') {
      try {
        const Controller = await ControllerRegistryService.getController(this.controllerName);
        if (this.host.isConnected) {
          this.controller = new Controller(this.host, this.history);
        }
      } catch (error) {
        console.error(error);
        return;
      }
    } else {
      this.controller = new DefaultController(this.host, this.history);
    }

    // get the model
    if (this.controller.model) {
      this.model = this.controller.model;

      // bind nodes
      ControllerBindingService.bindRecursive(this.host, this.model);

      // serve model
      this.listeners = new ComponentListenersService(this.host, { model: this.model });
      this.listeners.getModel.add();
    }
  }

  connectedCallback() {
    this.listeners && this.listeners.getModel.add();
  }

  disconnectedCallback() {
    this.listeners && this.listeners.getModel.remove();
  }

  @Method()
  async getModel() {
    if(this.controller) {
        return this.controller.model;
    }
    return undefined;
  }

  render() {
    return <slot/>;
  }
}

injectHistory(WccBindable);
