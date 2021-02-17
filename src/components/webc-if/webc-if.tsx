import type { EventEmitter } from '@stencil/core';
import {
  Component,
  h,
  Prop,
  State,
  Element,
  Watch,
  Event,
} from '@stencil/core';

import { MODEL_CHAIN_PREFIX } from '../../constants';
import {
  ControllerBindingService,
  ControllerTranslationBindingService,
} from '../../services';
import { promisifyEventEmit } from '../../utils';

import { getSlotContent } from './webc-if-utils';

const TRUE_CONDITION_SLOT_NAME = 'true';
const FALSE_CONDITION_SLOT_NAME = 'false';

@Component({
  tag: 'webc-if',
})
export class WebcIf {
  /**
   * The condition that will be evaluated in order to check which slots will be visible
   */
  @Prop()
  condition: any | undefined = undefined;

  /**
   * An optional model that will be used to check the condition;
   * if not provided, then the component will find the closes webc-bindable element and take the model from there
   */
  @Prop({ attribute: 'data-model' })
  model: any | undefined = undefined;

  private falseSlot = null;
  private trueSlot = null;

  @State()
  localModel: any;

  @State()
  translationModel: any;

  @State()
  conditionValue = false;

  @Element() host: HTMLWebcIfElement;

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

  async componentWillLoad() {
    if (!this.host.isConnected) {
      return;
    }

    const children = Array.from(this.host.children);

    this.trueSlot = getSlotContent(children, TRUE_CONDITION_SLOT_NAME);
    this.falseSlot = getSlotContent(children, FALSE_CONDITION_SLOT_NAME);

    if (!this.trueSlot && !this.falseSlot) {
      this.trueSlot = children.map(child => child.outerHTML).join('');
    }

    this.host.innerHTML = '';

    if (this.model) {
      this.localModel = this.model;
    } else {
      try {
        this.localModel = await promisifyEventEmit(this.getModelEvent);
      } catch (error) {
        console.error(error);
      }
    }

    try {
      this.translationModel = await promisifyEventEmit(
        this.getTranslationModelEvent,
      );
    } catch (error) {
      console.error(error);
    }

    this.updateConditionValue();
  }

  async componentDidRender() {
    if (this.localModel) {
      this.bindModelToVisibleSlot(this.host, this.localModel);
    }
  }

  @Watch('model')
  modelWatchHandler(newValue: any) {
    this.localModel = newValue;
    this.updateConditionValue();
  }

  private bindModelToVisibleSlot(element: Element, model: any) {
    for (let i = 0; i < element.children.length; i++) {
      const target = element.children[i];

      ControllerBindingService.bindModel(target, model);
      ControllerBindingService.bindAttributes(target, model);
      ControllerTranslationBindingService.bindAttributes(
        target,
        this.translationModel,
      );

      if (target.children) {
        this.bindModelToVisibleSlot(target, model);
      }
    }
  }

  private async updateConditionValue() {
    if (this.condition && this.condition.startsWith(MODEL_CHAIN_PREFIX)) {
      const conditionChain = this.condition.slice(1);
      this.conditionValue = this.localModel.getChainValue(conditionChain);

      this.localModel.onChange(conditionChain, _ => {
        this.conditionValue = this.localModel.getChainValue(conditionChain);
      });
    }
  }

  render() {
    return (
      <div innerHTML={this.conditionValue ? this.trueSlot : this.falseSlot} />
    );
  }
}
