import { Component, EventEmitter, h, Method, Prop, Event } from '@stencil/core';
import { RouterHistory, injectHistory } from '@stencil/router';
import { HostElement } from '../../decorators';
import {
  ComponentListenersService,
  ControllerRegistryService,
  ControllerBindingService,
  ControllerTranslationService,
  ControllerTranslationBindingService
} from '../../services'

import DefaultController from '../../../base/controllers/Controller.js';
import { promisifyEventEmit } from '../../utils';

@Component({
  tag: "wcc-bindable"
})
export class WccBindable {
  @HostElement() private host: HTMLElement;

  @Prop({ attribute: 'controller' }) controllerName: string | null;

  @Prop() history: RouterHistory;

  @Event({
    eventName: "webcardinal:routing:get",
    bubbles: true,
    composed: true,
    cancelable: true,
  })
  getRoutingEvent: EventEmitter;

  private controller;
  private model;
  private translationModel;
  private listeners: ComponentListenersService;

  async componentWillLoad() {
    const routingEvent = await promisifyEventEmit(this.getRoutingEvent);
    await ControllerTranslationService.loadAndSetTranslationForPage(routingEvent);

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

    let { model, translationModel } = this.controller;
    if (translationModel) {
      this.translationModel = translationModel;

      // bind nodes with translation model
      ControllerTranslationBindingService.bindRecursive(
        this.host,
        this.translationModel
      );
    }

    // get the model
    if (model) {
      this.model = model;

      // bind nodes
      ControllerBindingService.bindRecursive(this.host, this.model);
    }

    if (translationModel || model) {
      // serve models
      this.listeners = new ComponentListenersService(this.host, {
        model,
        translationModel,
      });
      model && this.listeners.getModel.add();
      translationModel && this.listeners.getTranslationModel.add();
    }
  }

  connectedCallback() {
    if (this.listeners) {
      let { getModel, getTranslationModel } = this.listeners;
      getModel && getModel.add();
      getTranslationModel && getTranslationModel.add();
    }
  }

  disconnectedCallback() {
    if (this.listeners) {
      let { getModel, getTranslationModel } = this.listeners;
      getModel && getModel.remove();
      getTranslationModel && getTranslationModel.remove();
    }
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
