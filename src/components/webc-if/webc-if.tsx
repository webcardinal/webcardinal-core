import type { EventEmitter } from '@stencil/core';
import { Component, h, Prop, State, Element, Watch, Event } from '@stencil/core';

import {
  DATA_IF_FALSE_CONDITION_SLOT_NAME,
  DATA_IF_TRUE_CONDITION_SLOT_NAME,
  MODEL_CHAIN_PREFIX,
} from '../../constants';
import { BindingService } from '../../services';
import { promisifyEventEmit, removeSlotInfoFromElement, getSlots, removeElementChildren } from '../../utils';

/**
 * @disable cheatsheet
 */
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

  private falseSlotElements = [];
  private trueSlotElements = [];

  @State()
  localModel: any;

  @State()
  translationModel: any;

  @State()
  conditionValue = false;

  @State()
  content: string;

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

    this.trueSlotElements = getSlots(children, DATA_IF_TRUE_CONDITION_SLOT_NAME);
    this.falseSlotElements = getSlots(children, DATA_IF_FALSE_CONDITION_SLOT_NAME);

    if (!this.trueSlotElements.length && !this.falseSlotElements.length) {
      this.trueSlotElements = children;
    }

    removeElementChildren(this.host);

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
      this.translationModel = await promisifyEventEmit(this.getTranslationModelEvent);
    } catch (error) {
      console.error(error);
    }

    this.updateConditionValue();
  }

  @Watch('model')
  modelWatchHandler(newValue: any) {
    this.localModel = newValue;
    this.updateConditionValue();
  }

  @Watch('conditionValue')
  conditionValueWatchHandler() {
    this.setVisibleContent();
  }

  private setVisibleContent() {
    const visibleSlots = this.conditionValue ? this.trueSlotElements : this.falseSlotElements;
    removeElementChildren(this.host);
    visibleSlots.forEach(slot => {
      const element = slot.cloneNode(true) as HTMLElement;

      // when nesting mutiple webc-ifs, the inner slots will have the hidden property set automatically
      removeSlotInfoFromElement(element);

      this.host.appendChild(element);
      BindingService.bindElement(element, {
        model: this.localModel,
        translationModel: this.translationModel,
        recursive: true,
        enableTranslations: true,
      });
    });
  }

  private async updateConditionValue() {
    if (this.condition) {
      if (this.condition.startsWith(MODEL_CHAIN_PREFIX)) {
        const { localModel } = this;
        const conditionChain = this.condition.slice(1);
        this.setExtractedConditionValue(localModel.getChainValue(conditionChain));

        localModel.onChange(conditionChain, () => {
          this.setExtractedConditionValue(localModel.getChainValue(conditionChain));
        });

        if (localModel.hasExpression(conditionChain)) {
          this.setExtractedConditionValue(localModel.evaluateExpression(conditionChain));

          localModel.onChangeExpressionChain(conditionChain, () => {
            this.setExtractedConditionValue(localModel.evaluateExpression(conditionChain));
          });
        }
      }
    } else {
      this.conditionValue = false;
    }
    this.setVisibleContent();
  }

  private async setExtractedConditionValue(conditionValue) {
    let value;
    if (conditionValue instanceof Promise) {
      try {
        value = await conditionValue;
      } catch (error) {
        console.error('webc-if condition promise failed', error);
        value = false;
      }
    } else {
      value = conditionValue;
    }
    this.conditionValue = value;
  }

  render() {
    return <slot />;
  }
}
