import type { EventEmitter } from '@stencil/core';
import { Component, Event, h, Prop } from '@stencil/core';

import { MODEL_KEY, SKIP_BINDING_FOR_COMPONENTS } from '../../constants';
import { HostElement } from '../../decorators';
import {
  ControllerBindingService,
  ControllerNodeValueBindingService,
  ControllerTranslationBindingService,
} from '../../services';
import { promisifyEventEmit, extractChain } from '../../utils';

import { getTemplateContent } from './webc-template-utils';

@Component({
  tag: 'webc-template',
  shadow: true,
})
export class WebcTemplate {
  @HostElement() host: HTMLElement;

  /**
   * The name of the template that will be loaded. The generated path will have the format ${basePath}/templates/${templateName}.html
   */
  @Prop({ reflect: true }) templateName: string;

  @Prop({ attribute: 'data-model', mutable: true }) chain = '';

  @Event({
    eventName: 'webcardinal:model:get',
    bubbles: true,
    composed: true,
    cancelable: true,
  })
  getModelEvent: EventEmitter;

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

  private bindRelativeModel = element => {
    const tag = element.tagName.toLowerCase();
    const chainSuffix = extractChain(element);
    if (chainSuffix) {
      const newChain =
        this.chain.length !== 1
          ? [this.chain, chainSuffix.slice(1)].filter(String).join('.')
          : chainSuffix;

      element.setAttribute(MODEL_KEY, newChain);
    }

    if (SKIP_BINDING_FOR_COMPONENTS.includes(tag)) {
      return;
    }

    ControllerBindingService.bindModel(element, this.model);
    ControllerBindingService.bindAttributes(element, this.model);
    ControllerTranslationBindingService.bindAttributes(
      element,
      this.translationModel,
    );
    ControllerNodeValueBindingService.bindNodeValue(
      element,
      this.model,
      this.translationModel,
    );

    if (element.children) {
      Array.from(element.children).forEach(child =>
        this.bindRelativeModel(child),
      );
    }
  };

  async componentWillLoad() {
    if (!this.host.isConnected) {
      return;
    }

    this.template = await getTemplateContent(this.templateName);
    this.host.innerHTML = this.template;

    this.chain = extractChain(this.host);

    if (this.chain) {
      try {
        this.model = await promisifyEventEmit(this.getModelEvent);
        this.translationModel = await promisifyEventEmit(
          this.getTranslationModelEvent,
        );
      } catch (error) {
        console.error(error);
      }

      if (this.host.children) {
        Array.from(this.host.children).forEach(child =>
          this.bindRelativeModel(child),
        );
      }
    }
  }

  render() {
    return <slot />;
  }
}
