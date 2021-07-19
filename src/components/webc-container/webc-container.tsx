import { Component, Event, EventEmitter, h, Method, Prop, State } from '@stencil/core';
import { HTMLStencilElement } from '@stencil/core/internal';
import { injectHistory, RouterHistory } from '@stencil/router';

import DefaultController from '../../../base/controllers/Controller.js';
import { VIEW_MODEL_KEY } from '../../constants';
import { HostElement } from '../../decorators';
import { BindingService, ComponentListenersService, ControllerRegistryService } from '../../services';
import {extractChain, getTranslationsFromState, mergeChains, promisifyEventEmit} from '../../utils';

@Component({
  tag: 'webc-container',
})
export class WebcContainer {
  @HostElement() host: HTMLStencilElement;

  @State() history: RouterHistory;

  private controllerInstance;
  private listeners: ComponentListenersService;
  private chain;
  private controllerElement;

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

  @Event({
    eventName: 'webcardinal:parentChain:get',
    bubbles: true,
    composed: true,
    cancelable: true,
  })
  getChainPrefix: EventEmitter;


  async componentWillLoad() {
    if (!this.host.isConnected) {
      return;
    }

    const [controllerElement, bindingElement] = this.resolveControllerElement();
    this.controllerElement = controllerElement;
    let model,
      translationModel,
      history = this.history;

    this.chain = extractChain(this.host);
    const hasInheritedModel = this.chain.indexOf("@") !== -1;

    if(hasInheritedModel){
      const chainPrefix = await  promisifyEventEmit(this.getChainPrefix);
      this.chain = mergeChains(chainPrefix, this.chain);

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
      translationModel = this.controllerInstance.translationModel;
    }

    // "default-controller" is attached when container does binding of undefined models or when controllers are not found
    // but if 'data-view-model="@"' is present binding is supported
    // (if there is a global model upper in the DOM, otherwise the webc-container can not hydrate)
    if (this.host.hasAttribute('default-controller') && !this.host.hasAttribute(VIEW_MODEL_KEY)) {
      return;
    }
    BindingService.bindChildNodes(bindingElement, {
      model,
      translationModel,
      recursive: true,
      chainPrefix: this.chain ? this.chain.slice(1) : null,
      enableTranslations: getTranslationsFromState(),
    });

    this.listeners = new ComponentListenersService(bindingElement, {
      model,
      translationModel,
      chain:this.chain
    });
    this.listeners.getModel.add();
    this.listeners.getTranslationModel.add();
    this.listeners.getParentChain.add();
  }

  async connectedCallback() {
    if (this.listeners) {
      const { getModel, getTranslationModel,getParentChain } = this.listeners;
      getModel?.add();
      getTranslationModel?.add();
      getParentChain?.add()
    }
  }

  async disconnectedCallback() {
    if (this.listeners) {
      const { getModel, getTranslationModel, getParentChain } = this.listeners;
      getModel?.remove();
      getTranslationModel?.remove();
      getParentChain?.remove();
    }

    // disconnectedCallback can be called multiple times
    // there is no way to listen to a "onDestroy" like event so we check if the host is still attached to the DOM
    setTimeout(() => {
      if (!document.body.contains(this.controllerElement)) {
        this.controllerInstance?.disconnectedCallback();
        //prevent cleaning models change callbacks that are shared with current controller instance
        if (!this.chain) {
          this.controllerInstance?.model?.cleanReferencedChangeCallbacks();
        }
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

    if (this.disableContainer) {
      return [target.parentElement, target];
    }

    return [target, target];
  }

  // It loads the controller specified as property or a default controller
  private async loadController(element: Element, history: RouterHistory, model?, translationModel?) {
    const loadDefaultController = () => {
      this.host.setAttribute('controller-default', '');
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
