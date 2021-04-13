import { Component, Event, EventEmitter, h, Method, Prop, State } from '@stencil/core';
import { HTMLStencilElement } from '@stencil/core/internal';
import { injectHistory, RouterHistory } from '@stencil/router';

import DefaultController from '../../../base/controllers/Controller.js';
import { HostElement } from '../../decorators';
import { RoutingState } from '../../interfaces';
import {
  BindingService,
  ComponentListenersService,
  ControllerRegistryService,
  ControllerTranslationService,
} from '../../services';
import { resolveTranslationsState, resolveRoutingState } from '../../utils';

@Component({
  tag: 'webc-container',
})
export class WebcContainer {
  @HostElement() host: HTMLStencilElement;

  @State() history: RouterHistory;

  private controllerInstance;
  private listeners: ComponentListenersService;

  /**
   * This property is a string that will permit the developer to choose his own controller.
   * If no value is set then the null default value will be taken and the component will use the basic Controller.
   */
  @Prop() controller: string = '';

  /**
   *  If it is not specified, all the innerHTML will be placed inside the unnamed slot.
   *  Otherwise the content will replace the <code>webc-container</code> element form DOM.
   */
  @Prop({ reflect: true }) disableContainer: boolean = false;

  /**
   * If this flag is set it will override the <strong>translations</strong> from <code>webcardinal.json</code>.
   */
  @Prop({ reflect: true }) translations: boolean = false;

  /**
   * Routing configuration received from <code>webc-app-router</code>.
   */
  @Event({
    eventName: 'webcardinal:routing:get',
    bubbles: true,
    cancelable: true,
    composed: true,
  })
  getRoutingStateEvent: EventEmitter<RoutingState>;

  async componentWillLoad() {
    if (!this.host.isConnected) {
      return;
    }

    this.translations = resolveTranslationsState(this);
    if (this.translations) {
      const routingState = await resolveRoutingState(this);
      this.translations = await ControllerTranslationService.loadAndSetTranslationsForPage(routingState);
      if (!this.translations) {
        console.warn('Translations were automatically disabled for current page', window.WebCardinal?.state?.activePage || {})
      }
    }

    const controllerElement = this.resolveControllerElement();
    this.controllerInstance = await this.loadController(controllerElement);

    if (this.host.hasAttribute('default-controller')) {
      return;
    }

    const { model, translationModel } = this.controllerInstance;
    if (translationModel || model) {
      BindingService.bindChildNodes(controllerElement, {
        model,
        translationModel,
        recursive: true,
        enableTranslations: this.translations,
      });
      this.listeners = new ComponentListenersService(this.host, {
        model,
        translationModel,
      });
      model && this.listeners.getModel.add();
      translationModel && this.listeners.getTranslationModel.add();
    }
  }

  async connectedCallback() {
    if (this.listeners) {
      const { getModel, getTranslationModel } = this.listeners;
      getModel?.add();
      getTranslationModel?.add();
    }
  }

  async disconnectedCallback() {
    if (this.listeners) {
      const { getModel, getTranslationModel } = this.listeners;
      getModel?.remove();
      getTranslationModel?.remove();
    }

    // disconnectedCallback can be called multiple times
    // there is no way to listen to a "onDestroy" like event so we check if the host is still attached to the DOM
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

  // It resolves "this.element" from any type of WebCardinal Controller
  private resolveControllerElement() {
    let target = this.host as HTMLElement;
    const shadowRoot = this.host.parentNode;
    if (shadowRoot instanceof ShadowRoot) {
      if (this.host.hasAttribute('data-modal')) {
        target = shadowRoot.host as HTMLElement;
      }
    }
    if (this.disableContainer) {
      target = target.parentElement;
    }
    return target;
  }

  // It loads the controller specified as property or a default controller
  private async loadController(element: HTMLElement) {
    const loadDefaultController = () => {
      this.host.setAttribute('default-controller', '');
      return new DefaultController(element, this.history);
    }

    if (this.host.hasAttribute('controller-name') && !this.controller) {
      console.warn([
        `Attribute "controller-name" is deprecated!`,
        `Use "controller" instead!`
      ].join('\n'), `target:`, this.host);
      this.controller = this.host.getAttribute('controller-name');
    }

    if (typeof this.controller !== 'string') {
      console.error('"controller" must be a string!');
      return loadDefaultController();
    }

    if (this.controller.length === 0) {
      return loadDefaultController();
    }

    try {
      const Controller = await ControllerRegistryService.getController(this.controller);
      return new Controller(element, this.history);
    } catch (error) {
      console.error(`Error while loading controller "${this.controller}"`, error);
      return loadDefaultController();
    }
  }

  render() {
    return this.disableContainer ? null : <slot />;
  }
}

injectHistory(WebcContainer);
