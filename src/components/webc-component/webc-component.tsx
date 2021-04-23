import { Component, Event, EventEmitter, Method, Prop } from '@stencil/core';
import { HTMLStencilElement } from '@stencil/core/internal';

import { MODEL_CHAIN_PREFIX, TRANSLATION_CHAIN_PREFIX, VIEW_MODEL_KEY } from '../../constants';
import { HostElement } from '../../decorators';
import { BindingService } from '../../services';
import { extractChain, promisifyEventEmit, resolveEnableTranslationState } from '../../utils';

import { getTemplate } from './webc-component.utils';

@Component({
  tag: 'webc-component',
})
export class WebcComponent {
  @HostElement() host: HTMLStencilElement;

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
   * If this flag is specified, when translations are enabled, it will disable binding and loading of translations.
   */
  @Prop({ reflect: true }) disableTranslations: boolean = false;

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

  private container;
  private model;
  private translationModel;
  private chain;
  private html;

  async componentWillLoad() {
    if (!this.host.isConnected) {
      return;
    }

    this.html = this.replaceWithActualChain(await getTemplate(this.template));
    if (!this.html) {
      return;
    }

    this.chain = extractChain(this.element);

    if (this.controller) {
      this.container = Object.assign(document.createElement('webc-container'), {
        controller: this.controller,
        innerHTML: this.html,
      }) as HTMLWebcContainerElement;
      if (this.chain) {
        this.container.setAttribute(VIEW_MODEL_KEY, this.chain);
      }
      this.container.setAttribute('bind-component', '');
      // this.container.setAttribute('disable-container', '');
      this.host.insertAdjacentElement('afterend', this.container);
      return;
    }

    try {
      this.model = await promisifyEventEmit(this.getModelEvent);
      this.translationModel = await promisifyEventEmit(this.getTranslationModelEvent);
    } catch (error) {
      console.error(error);
    }

    this.host.insertAdjacentHTML('afterend', this.html);
    BindingService.bindChildNodes(this.element.shadowRoot || this.element, {
      model: this.model,
      translationModel: this.translationModel,
      recursive: true,
      chainPrefix: this.chain ? this.chain.slice(1) : null,
      enableTranslations: resolveEnableTranslationState(this),
    });
  }

  /**
   * The model from controller is exposed by this method.
   */
  @Method()
  async getModel() {
    if (this.container) {
      return await this.container.getModel();
    }

    if (this.model) {
      return this.model;
    }

    return undefined;
  }

  /**
   * The translation model from controller is exposed by this method.
   */
  @Method()
  async getTranslationModel() {
    if (this.container) {
      return await this.container.getTranslationModel();
    }

    if (this.translationModel) {
      return this.translationModel;
    }

    return undefined;
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
