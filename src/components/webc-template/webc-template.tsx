import type { EventEmitter } from '@stencil/core';
import { Component, Event, h, Prop } from '@stencil/core';

import { HostElement } from '../../decorators';
import {bindChain, extractChain, promisifyEventEmit} from '../../utils';

import { getTemplate } from './webc-template-utils';

@Component({
  tag: 'webc-template',
  shadow: true,
})
export class WebcTemplate {
  @HostElement() host: HTMLElement;

  /**
   * The name of the template that will be loaded.
   * The generated path will have the format <code>${basePath}/templates/${templateName}.html</code>.
   */
  @Prop({ attribute: 'template', reflect: true }) templateName: string;

  @Prop({ attribute: 'data-model', mutable: true }) chain = '';

  /**
   *  If it is not specified, all the markup coming <code>template</code> attribute will be placed inside innerHTML after the unnamed slot.
   *  Otherwise the content will replace the <code>webc-template</code> element form DOM.
   */
  @Prop() disableContainer = false;

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

  async componentWillLoad() {
    if (!this.host.isConnected) {
      return;
    }

    this.host.innerHTML = await getTemplate(this.templateName);

    this.chain = extractChain(this.host);
    if (this.chain) {
      try {
        await bindChain(this.host, {
          chain: this.chain,
          model: await promisifyEventEmit(this.getModelEvent),
          translationModel: await promisifyEventEmit(this.getTranslationModelEvent)
        });
      } catch (error) {
        console.error(error);
      }
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
