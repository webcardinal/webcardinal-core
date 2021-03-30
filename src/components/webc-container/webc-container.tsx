import type { EventEmitter } from '@stencil/core';
import { Component, h, Method, Prop, Event, State } from '@stencil/core';
import type { RouterHistory } from '@stencil/router';
import { injectHistory } from '@stencil/router';

import DefaultController from '../../../base/controllers/Controller.js';
import { HostElement } from '../../decorators';
import {
  BindingService,
  ComponentListenersService,
  ControllerRegistryService,
  ControllerTranslationService,
} from '../../services';
import { promisifyEventEmit } from '../../utils';

@Component({
  tag: 'webc-container',
})
export class WebcContainer {
  @HostElement() private host: HTMLElement;

  @State() history: RouterHistory;

  /**
   * This property is a string that will permit the developer to choose his own controller.
   * If no value is set then the null default value will be taken and the component will use the basic Controller.
   */
  @Prop({ reflect: true }) controller: string;

  /**
   *  If it is not specified, all the innerHTML will be placed inside the unnamed slot.
   *  Otherwise the content will replace the <code>webc-container</code> element form DOM.
   */
  @Prop() disableContainer = false;

  @Prop() enableTranslations: boolean = false;

  /**
   * Routing configuration received from <code>webc-app-router</code>.
   */
  @Event({
    eventName: 'webcardinal:routing:get',
    bubbles: true,
    composed: true,
    cancelable: true,
  })
  getRoutingEvent: EventEmitter;

  /**
   * Enable translations event received from configuration.
   */
  @Event({
    eventName: 'webcardinal:config:getTranslations',
    bubbles: true,
    composed: true,
    cancelable: true,
  })
  getTranslationsEvent: EventEmitter;

  private controllerInstance;
  private listeners: ComponentListenersService;

  async componentWillLoad() {
    if (!this.host.isConnected) {
      return;
    }

    const routingEvent = await promisifyEventEmit(this.getRoutingEvent);
    const translationsState = await promisifyEventEmit(this.getTranslationsEvent);
    const enableTranslations = translationsState || this.enableTranslations;

    if (enableTranslations) {
      await ControllerTranslationService.loadAndSetTranslationForPage(routingEvent);
    }

    let target = this.host;
    let shadowRoot = this.host.parentNode;

    if (shadowRoot instanceof ShadowRoot) {
      if (this.host.hasAttribute('data-modal')) {
        target = shadowRoot.host as HTMLElement;
      }
    }
    if (this.disableContainer) {
      target = target.parentElement;
    }

    // load controller
    const controllerName = this.controller;
    if (typeof controllerName === 'string') {
      try {
        const Controller = await ControllerRegistryService.getController(controllerName);
        if (this.host.isConnected) {
          this.controllerInstance = new Controller(target, this.history);
        }
      } catch (error) {
        console.error(error);
        return;
      }
    } else {
      this.controllerInstance = new DefaultController(target, this.history);
    }
    const { model, translationModel } = this.controllerInstance;

    if (translationModel || model) {
      BindingService.bindChildNodes(target, {
        model,
        translationModel,
        recursive: true,
        enableTranslations,
      });

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
        this.controllerInstance?.disconnectedCallback();
      }
    }, 100);
  }

  async componentDidLoad() {
    if (this.disableContainer) {
      Array.from(this.host.childNodes).forEach(node => this.host.parentNode.insertBefore(node, this.host));
      this.host.remove();
    }
  }

  /**
   * The model from controller is exposed by this method.
   */
  @Method()
  async getModel() {
    if (this.controllerInstance) {
      return this.controllerInstance.model;
    }
    return undefined;
  }

  /**
   * The translation model from controller is exposed by this method.
   */
  @Method()
  async getTranslationModel() {
    if (this.controllerInstance) {
      return this.controllerInstance.translationModel;
    }
    return undefined;
  }

  render() {
    if (this.disableContainer) {
      return;
    }

    return <slot />;
  }
}

injectHistory(WebcContainer);
