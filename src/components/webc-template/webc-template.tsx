import type { EventEmitter } from '@stencil/core';
import { Component, Event, h, Prop } from '@stencil/core';

import { HostElement } from '../../decorators';
import { extractChain, promisifyEventEmit } from '../../utils';

import { getTemplate } from './webc-template-utils';
import { BindingService } from '../../services';

@Component({
  tag: 'webc-template',
  shadow: true,
})
export class WebcTemplate {
  @HostElement() host: HTMLElement;

  /**
   * The name of the template that will be loaded.
   * The generated path will have the format <code>${basePath}/templates/${template}.html</code>.
   */
  @Prop({ reflect: true }) template: string;

  /**
   *  If it is not specified, all the markup coming <code>template</code> attribute will be placed inside innerHTML after the unnamed slot.
   *  Otherwise the content will replace the <code>webc-template</code> element form DOM.
   */
  @Prop() disableContainer: boolean = false;

  @Prop() enableTranslations: boolean = false;

  /**
   * Through this event model is received (from webc-container, webc-for, webc-if or any component that supports a controller).
   */
  @Event({
    eventName: 'webcardinal:model:get',
    bubbles: true,
    composed: true,
    cancelable: true,
  })
  getModelEvent: EventEmitter;

  /**
   * Through this event translation model is received.
   */
  @Event({
    eventName: 'webcardinal:translationModel:get',
    bubbles: true,
    composed: true,
    cancelable: true,
  })
  getTranslationModelEvent: EventEmitter;

  /**
   * Enable translations event received from configuration.
   */
  @Event({
    eventName: 'webcardinal:config:getTranslations',
    bubbles: true,
    composed: true,
    cancelable: true,
  })
  getTranslationsStateEvent: EventEmitter;

  private model;
  private translationModel;
  private chain = '';

  async componentWillLoad() {
    if (!this.host.isConnected) {
      return;
    }

    this.host.innerHTML = await getTemplate(this.template);

    this.chain = extractChain(this.host);

    if (this.chain) {
      let translationsState = false;
      try {
        this.model = await promisifyEventEmit(this.getModelEvent);
        this.translationModel = await promisifyEventEmit(this.getTranslationModelEvent);
        translationsState = await promisifyEventEmit(this.getTranslationsStateEvent);
      } catch (error) {
        console.error(error);
      }

      BindingService.bindChildNodes(this.host, {
        model: this.model,
        translationModel: this.translationModel,
        recursive: true,
        chainPrefix: this.chain ? this.chain.slice(1) : null,
        enableTranslations: translationsState || this.enableTranslations,
      });
    }
  }

  async componentDidLoad() {
    if (this.disableContainer) {
      Array.from(this.host.childNodes).forEach(node => this.host.parentNode.insertBefore(node, this.host));
      this.host.remove();
    }
  }

  render() {
    if (this.disableContainer) {
      return;
    }

    return <slot />;
  }
}
