import { Component, Event, EventEmitter, h, Method, Prop } from '@stencil/core';
import { HTMLStencilElement } from '@stencil/core/internal';

import { HostElement } from '../../decorators';
import { BindingService } from '../../services';
import {extractChain, getTranslationsFromState, mergeChains, promisifyEventEmit} from '../../utils';

import { getTemplate } from './webc-template.utils';

@Component({
  tag: 'webc-template',
  shadow: true,
})
export class WebcTemplate {
  @HostElement() host: HTMLStencilElement;

  /**
   * The name of the template that will be loaded.
   * The generated path will have the format <code>${basePath + skinPath}/templates/${template}.html</code>.
   */
  @Prop({ reflect: true }) template: string;

  /**
   *  If it is not specified, all the markup coming <code>template</code> attribute will be placed inside innerHTML after the unnamed slot.
   *  Otherwise the content will replace the <code>webc-template</code> element form DOM.
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

  private model;
  private translationModel;
  private chain = '';

  async componentWillLoad() {
    if (!this.host.isConnected) {
      return;
    }

    if (this.host.hasAttribute('template-name') && !this.template) {
      console.warn(
        [`Attribute "template-name" is deprecated!`, `Use "template" instead!`].join('\n'),
        `target:`,
        this.host,
      );
      this.template = this.host.getAttribute('template-name');
    }

    this.host.innerHTML = await getTemplate(this.template);
    const chainPrefix = await  promisifyEventEmit(this.getChainPrefix);
    this.chain = extractChain(this.host);
    this.chain = mergeChains(chainPrefix, this.chain);

    if (typeof this.chain !== "undefined") {
      try {
        this.model = await promisifyEventEmit(this.getModelEvent);
        this.translationModel = await promisifyEventEmit(this.getTranslationModelEvent);
      } catch (error) {
        console.error(error);
      }

      BindingService.bindChildNodes(this.host, {
        model: this.model,
        translationModel: this.translationModel,
        recursive: true,
        chainPrefix: this.chain ? this.chain.slice(1) : null,
        enableTranslations: getTranslationsFromState(),
      });
    }
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
    if (this.translationModel) {
      return this.translationModel;
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
