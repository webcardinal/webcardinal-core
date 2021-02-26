import type { EventEmitter } from '@stencil/core';
import { Component, h, Method, Prop, Event } from '@stencil/core';
import type { RouterHistory } from '@stencil/router';
import { injectHistory } from '@stencil/router';

import DefaultController from '../../../base/controllers/Controller.js';
import { HostElement } from '../../decorators';
import {
  ComponentListenersService,
  ControllerRegistryService,
  ControllerBindingService,
  ControllerTranslationService,
  ControllerTranslationBindingService,
  ControllerNodeValueBindingService,
} from '../../services';
import { promisifyEventEmit } from '../../utils';

@Component({
  tag: 'webc-page',
})
export class WebcPage {
  @HostElement() private host: HTMLElement;

  @Prop({ attribute: 'controller' }) controllerName: string | null;

  @Prop() history: RouterHistory;

  @Prop() enableTranslations = false;

  @Event({
    eventName: 'webcardinal:routing:get',
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

    if (this.enableTranslations) {
      await ControllerTranslationService.loadAndSetTranslationForPage(routingEvent);
    }

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

    const { model, translationModel } = this.controller;
    if (translationModel) {
      this.translationModel = translationModel;

      if (this.enableTranslations) {
        // bind nodes with translation model
        ControllerTranslationBindingService.bindRecursive(this.host, this.translationModel);
      }
    }

    // get the model
    if (model) {
      this.model = model;

      // bind nodes
      ControllerBindingService.bindRecursive(this.host, this.model);
      ControllerNodeValueBindingService.bindRecursive(this.host, this.model, this.translationModel);
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
      const { getModel, getTranslationModel } = this.listeners;
      getModel?.add();
      getTranslationModel?.add();
    }
  }

  disconnectedCallback() {
    if (this.listeners) {
      const { getModel, getTranslationModel } = this.listeners;
      getModel?.remove();
      getTranslationModel?.remove();
    }

    // disconnectedCallback can be called multiple times
    // there is no way to listen to a OnDestroy like event so we check if the host is still attached to the DOM
    setTimeout(() => {
      if (!document.body.contains(this.host)) {
        this.controller?.disconnectedCallback();
      }
    }, 100);
  }

  @Method()
  async getModel() {
    if (this.controller) {
      return this.controller.model;
    }
    return undefined;
  }

  @Method()
  async getTranslationModel() {
    if (this.controller) {
      return this.controller.translationModel;
    }
    return undefined;
  }

  render() {
    return <slot />;
  }
}

injectHistory(WebcPage);
