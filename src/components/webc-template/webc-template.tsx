import type { EventEmitter } from '@stencil/core';
import { Component, Event, h, Prop } from '@stencil/core';

import { HostElement } from '../../decorators';
import { BindingService } from '../../services';
import { promisifyEventEmit, extractChain } from '../../utils';

import { getTemplateContent } from './webc-template-utils';

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
   *  If it is not specified, all the markup specified in <code>template</code> attribute will be placed inside innerHTML after the unnamed slot.
   *  Otherwise the content will replace the <code>webc-template</code> element form DOM.
   */
  @Prop() disableContainer: boolean; // false by default

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

  private template;
  private model;
  private translationModel;

  async componentWillLoad() {
    if (!this.host.isConnected) {
      return;
    }

    this.template = await getTemplateContent(this.templateName);

    this.chain = extractChain(this.host);

    if (this.chain) {
      try {
        this.model = await promisifyEventEmit(this.getModelEvent);
        this.translationModel = await promisifyEventEmit(this.getTranslationModelEvent);
      } catch (error) {
        console.error(error);
      }

      Array.from(this.host.childNodes).forEach(child => {
        BindingService.bindElement(child, {
          model: this.model,
          translationModel: this.translationModel,
          recursive: true,
          enableTranslations: true,
          chainPrefix: this.chain ? this.chain.slice(1) : null,
        });
      });
    }
  }

  render() {
    if (this.disableContainer) {
      const parser = new DOMParser();
      const html = parser.parseFromString(this.template, 'text/html');
      for (const part of ['head', 'body']) {
        for (const child of Array.from(html[part].childNodes)) {
          this.host.parentNode.insertBefore(child as ChildNode, this.host);
        }
      }
      this.host.remove();
      return;
    }

    this.host.innerHTML += this.template;
    return <slot />;
  }
}
