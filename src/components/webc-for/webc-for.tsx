import type { EventEmitter } from '@stencil/core';
import { Component, Event, h, Prop } from '@stencil/core';
import type { RouterHistory } from '@stencil/router';

import { MODEL_KEY, SKIP_BINDING_FOR_COMPONENTS } from '../../constants';
import { HostElement } from '../../decorators';
import {
  ControllerBindingService,
  ControllerNodeValueBindingService,
  ControllerRegistryService,
  ControllerTranslationBindingService,
} from '../../services';
import { promisifyEventEmit, extractChain, removeSlotInfoFromElement } from '../../utils';

import { createDOMMap, diff } from './webc-for-utils';

const NO_DATA_SLOT_NAME = 'no-data';

@Component({
  tag: 'webc-for',
  shadow: true,
})
export class WebcFor {
  @HostElement() host: HTMLElement;

  @Prop() history: RouterHistory;

  @Prop({ attribute: 'controller' }) controllerName: string | null;

  @Prop({ attribute: 'data-model' }) chain = '';

  @Prop() autoBind = false;

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

  private template = [];
  private noDatatemplate = [];
  private controller;
  private model;
  private translationModel;
  private existingNodes = [];

  private bindRelativeModel = (element, index) => {
    const tag = element.tagName.toLowerCase();
    let chainSuffix = extractChain(element);
    if (chainSuffix) {
      chainSuffix = chainSuffix.slice(1);
      element.setAttribute(MODEL_KEY, [this.chain, index, chainSuffix].filter(String).join('.'));
    } else if (this.autoBind === true) {
      element.setAttribute(MODEL_KEY, [this.chain, index].join('.'));
    }

    if (SKIP_BINDING_FOR_COMPONENTS.includes(tag)) {
      return;
    }

    const modelChainPrefix = [this.chain.slice(1), index].join('.');

    ControllerBindingService.bindModel(element, this.model);
    ControllerBindingService.bindAttributes(element, this.model, modelChainPrefix);
    ControllerTranslationBindingService.bindAttributes(element, this.translationModel);

    if (element.childNodes) {
      Array.from(element.childNodes).forEach(child =>
        ControllerNodeValueBindingService.bindNodeValue(child as ChildNode, this.model, this.translationModel, modelChainPrefix),
      );
    }
    if (element.children) {
      Array.from(element.children).forEach(child => this.bindRelativeModel(child, index));
    }
  };

  private _handleTemplate() {
    const chain = this.chain.slice(1);
    const renderTemplate = () => {
      if (!this.model) return;

      const model = this.model.getChainValue(chain);
      if (!Array.isArray(model)) {
        console.error(`Attribute "${MODEL_KEY}" must be an array in the model!`);
        return;
      }

      if (!model.length) {
        this.noDatatemplate.forEach(template => {
          const element = template.cloneNode(true) as HTMLElement;
          // when nesting mutiple webc-fors, the inner slots will have the hidden property set automatically
          removeSlotInfoFromElement(element);

          this.host.appendChild(element);
          this.bindRelativeModel(element, '');
          return;
        });
      }

      for (let i = 0; i < model.length; i++) {
        const updatedNodes = [];

        for (const node of this.template) {
          const element = node.cloneNode(true) as HTMLElement;
          this.bindRelativeModel(element, i);

          updatedNodes.push(element);
        }

        if (this.existingNodes[i]) {
          // we have existing nodes that we need to update
          updatedNodes.forEach((element, index) => {
            const updatedElement = document.createElement('div');
            updatedElement.appendChild(element);

            const existingElement = document.createElement('div');
            existingElement.appendChild(this.existingNodes[i][index].cloneNode(true) as HTMLElement);

            const templateMap = createDOMMap(updatedElement);
            const domMap = createDOMMap(existingElement);
            diff(templateMap, domMap, this.existingNodes[i][index]);
          });
        } else {
          updatedNodes.forEach(element => {
            this.host.appendChild(element);
          });
        }

        this.existingNodes[i] = updatedNodes;
      }
    };

    renderTemplate();

    this.model.onChange(chain, () => {
      // todo: further optimize the rendering by checking exactly which element of the array triggered the change
      renderTemplate();
    });

    if (this.model.hasExpression(chain)) {
      this.model.onChangeExpressionChain(chain, () => {
        renderTemplate();
      });
    }
  }

  async componentWillLoad() {
    if (!this.host.isConnected) {
      return;
    }

    // validate chain
    this.chain = extractChain(this.host);

    // get specific model (from controller or parent node)
    if (typeof this.controllerName === 'string') {
      try {
        const Controller = await ControllerRegistryService.getController(this.controllerName);
        if (this.host.isConnected) {
          this.controller = new Controller(this.host, this.history);
          if (this.controller.model) {
            this.model = this.controller.model;
          }
          if (this.controller.translationModel) {
            this.translationModel = this.controller.translationModel;
          }
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      try {
        this.model = await promisifyEventEmit(this.getModelEvent);
        this.translationModel = await promisifyEventEmit(this.getTranslationModelEvent);
      } catch (error) {
        console.error(error);
      }
    }

    // save the template for each item of array
    while (this.host.children.length > 0) {
      const firstChild = this.host.children[0];
      if (firstChild.getAttribute('slot') === NO_DATA_SLOT_NAME) {
        this.noDatatemplate.push(firstChild);
      } else {
        this.template.push(firstChild);
      }

      firstChild.remove();
    }

    this._handleTemplate();
  }

  render() {
    return <slot />;
  }
}
