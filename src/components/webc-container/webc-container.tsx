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
import { resolveRoutingState, resolveEnableTranslationState, extractChain, promisifyEventEmit } from '../../utils';
import { VIEW_MODEL_KEY } from '../../constants';

@Component({
  tag: 'webc-container',
})
export class WebcContainer {
  @HostElement() host: HTMLStencilElement;

  @State() history: RouterHistory;

  private controllerInstance;
  private listeners: ComponentListenersService;
  private chain;

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
   * If this flag is specified, when translations are enabled, it will disable binding and loading of translations.
   */
  @Prop({ reflect: true }) disableTranslations: boolean = false;

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

  /**
   * Through this event the model is received.
   */
  @Event({
    eventName: 'webcardinal:model:get',
    bubbles: true,
    composed: true,
    cancelable: true,
  })
  getModelEvent: EventEmitter;

  /**
   * Through this event the translation model is received.
   */
  @Event({
    eventName: 'webcardinal:translationModel:get',
    bubbles: true,
    composed: true,
    cancelable: true,
  })
  getTranslationModelEvent: EventEmitter;

  async componentWillLoad() {
    if (!this.host.isConnected) {
      return;
    }

    const enableTranslations = resolveEnableTranslationState(this);
    if (enableTranslations) {
      const routingState = await resolveRoutingState(this);
      if (!(await ControllerTranslationService.loadAndSetTranslationsForPage(routingState))) {
        // TODO: future optimization, do not load any translations for this page in the current context
        // while the user is in the same page;
      }
    }

    const [controllerElement, bindingElement] = this.resolveControllerElement();
    let model,
      translationModel,
      history = this.history;

    this.chain = extractChain(this.host);

    if (this.chain) {
      try {
        model = await promisifyEventEmit(this.getModelEvent);
        translationModel = await promisifyEventEmit(this.getTranslationModelEvent);
        this.controllerInstance = await this.loadController(controllerElement, history, model, translationModel);
      } catch (error) {
        console.error(error);
      }
    } else {
      this.controllerInstance = await this.loadController(controllerElement, history);
      model = this.controllerInstance.model;
      translationModel = this.controllerInstance.model;
    }

    // "default-controller" is attached when container does binding of undefined models or when controllers are not found
    // but if 'data-view-model="@"' is present binding is supported
    // (if there is a global model upper in the DOM, otherwise the webc-container can not hydrate)
    if (this.host.hasAttribute('default-controller') && !this.host.hasAttribute(VIEW_MODEL_KEY)) {
      return;
    }

    if (model || translationModel) {
      BindingService.bindChildNodes(bindingElement, {
        model,
        translationModel,
        recursive: true,
        chainPrefix: this.chain ? this.chain.slice(1) : null,
        enableTranslations,
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
  private resolveControllerElement(): [Element, Element] {
    let target = this.host as HTMLElement;

    if (this.host.hasAttribute('bind-modal')) {
      const parentNode = this.host.parentNode;
      if (parentNode instanceof ShadowRoot) {
        // bind webc-modal slots
        return [parentNode.host, parentNode.host];
      }
    }

    if (this.host.hasAttribute('bind-component')) {
      const parentNode = this.host.parentNode;
      if (parentNode instanceof ShadowRoot) {
        return [parentNode.host, this.host];
      }
      if (parentNode instanceof HTMLElement) {
        return [parentNode, this.host];
      }
    }

    if (this.disableContainer) {
      return [target.parentElement, target.parentElement];
    }

    return [target, target];
  }

  // It loads the controller specified as property or a default controller
  private async loadController(element: Element, history: RouterHistory, model?, translationModel?) {
    const loadDefaultController = () => {
      this.host.setAttribute('default-controller', '');
      return new DefaultController(element, history, model, translationModel);
    };

    if (this.host.hasAttribute('controller-name') && !this.controller) {
      console.warn(
        [`Attribute "controller-name" is deprecated!`, `Use "controller" instead!`].join('\n'),
        `target:`,
        this.host,
      );
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
      return new Controller(element, history, model, translationModel);
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
