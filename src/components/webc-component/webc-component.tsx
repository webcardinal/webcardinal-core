import { Component, Event, EventEmitter, Method, Prop, State } from '@stencil/core';
import { HTMLStencilElement } from '@stencil/core/internal';
import { injectHistory, RouterHistory } from '@stencil/router';

import { MODEL_CHAIN_PREFIX, TRANSLATION_CHAIN_PREFIX, VIEW_MODEL_KEY } from '../../constants';
import { HostElement } from '../../decorators';
import { BindingService, ComponentListenersService, ControllerRegistryService } from '../../services';
import { extractChain, getTranslationsFromState, promisifyEventEmit } from '../../utils';

import { getTemplate } from './webc-component.utils';

@Component({
  tag: 'webc-component',
})
export class WebcComponent {
  @HostElement() host: HTMLStencilElement;

  @State() history: RouterHistory;

  /**
   * This property is a string that will permit the developer to choose his own controller.
   * If no value is set then the null default value will be taken and the component will use the basic Controller.
   */
  @Prop() controller: string = '';

  /**
   * The name of the template that will be loaded.
   * The generated path will have the format <code>${basePath + skinPath}/elements/${template}.html</code>.
   */
  @Prop({ reflect: true }) template: string;

  /**
   * The reference to actual CustomElement / Component that is created.
   */
  @Prop() element: HTMLElement;

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

  private model;
  private translationModel;
  private html;
  private chain; // data-view-model
  private listeners: ComponentListenersService;

  async componentWillLoad() {
    if (!this.host.isConnected) {
      return;
    }

    this.html = this.replaceWithActualChain(await getTemplate(this.template));
    if (!this.html) {
      return;
    }

    try {
      this.model = await promisifyEventEmit(this.getModelEvent);
      this.translationModel = await promisifyEventEmit(this.getTranslationModelEvent);
    } catch (error) {
      console.error(error);
    }

    if (this.controller) {
      const Controller = await ControllerRegistryService.getController(this.controller);
      if (Controller) {
        try {
          const instance = new Controller(this.element, this.history, this.model, this.translationModel);
          if (!this.model) {
            this.model = instance.model;
          }
          if (!this.translationModel) {
            this.translationModel = instance.translationModel;
          }
        } catch (error) {
          console.error(error);
        }
      }
    }

    this.host.insertAdjacentHTML('afterend', this.html);

    this.chain = extractChain(this.element);

    const model = this.model;
    const translationModel = this.translationModel;
    const recursive = true;
    const chainPrefix = this.chain ? this.chain.slice(1) : null;
    const enableTranslations = getTranslationsFromState();

    if (this.element.shadowRoot) {
      BindingService.bindChildNodes(this.element.shadowRoot, {
        model,
        translationModel,
        recursive,
        chainPrefix,
        enableTranslations,
      });
    }

    BindingService.bindChildNodes(this.element, {
      model,
      translationModel,
      recursive,
      chainPrefix,
      enableTranslations,
    });

    this.listeners = new ComponentListenersService(this.element, {
      model: this.model,
      translationModel: this.translationModel,
    });
    this.listeners.getModel.add();
    this.listeners.getTranslationModel.add();
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
  }

  /**
   * The model is exposed by this method.
   */
  @Method()
  async getModel() {
    if (this.model) {
      return this.model;
    }

    return undefined;
  }

  /**
   * The translation model is exposed by this method.
   */
  @Method()
  async getTranslationModel() {
    if (this.translationModel) {
      return this.translationModel;
    }

    return undefined;
  }

  /**
   * The listeners are exposed by this method.
   */
  @Method()
  async getListeners() {
    return this.listeners;
  }

  private replaceWithActualChain(plainHTML) {
    const replaceAttributes = plainHTML => {
      let documentHTML: Document;

      try {
        const parser = new DOMParser();
        documentHTML = parser.parseFromString(plainHTML, 'text/html');
      } catch (error) {
        console.error(error);
      }

      if (!documentHTML || !documentHTML.body) return;

      const replaceInElementWithActualChain = (element: Element) => {
        for (const attr of Array.from(element.attributes)) {
          if (attr.nodeValue.startsWith(MODEL_CHAIN_PREFIX) || attr.nodeValue.startsWith(TRANSLATION_CHAIN_PREFIX)) {
            const key = attr.nodeValue.slice(1);
            if (this.host.hasAttribute(key)) {
              element.setAttribute(attr.nodeName, this.host.getAttribute(key));
              this.host.removeAttribute(attr.nodeName);
            }
          }
        }

        for (let child of Array.from(element.children)) {
          replaceInElementWithActualChain(child);
        }
      };

      replaceInElementWithActualChain(documentHTML.body);

      return [documentHTML.head.innerHTML, documentHTML.body.innerHTML].join('');
    };
    const replaceInnerSyntax = plainHTML => {
      Array.from(this.host.attributes).forEach(attr => {
        if (attr.nodeName === VIEW_MODEL_KEY) return;
        const innerSyntaxRegEx = new RegExp(
          `{{.*[${MODEL_CHAIN_PREFIX}${TRANSLATION_CHAIN_PREFIX}]${attr.nodeName}.*}}`,
          'g',
        );
        if ([MODEL_CHAIN_PREFIX, TRANSLATION_CHAIN_PREFIX].includes(attr.nodeValue[0])) {
          plainHTML = plainHTML.replace(innerSyntaxRegEx, `{{ ${attr.nodeValue} }}`);
          return;
        }
        plainHTML = plainHTML.replace(innerSyntaxRegEx, attr.nodeValue);
      });
      return plainHTML;
    };

    return replaceInnerSyntax(replaceAttributes(plainHTML));
  }

  render() {
    return;
  }
}

injectHistory(WebcComponent);
