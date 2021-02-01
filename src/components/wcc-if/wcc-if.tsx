import { Component, h, Prop, State, Element, Watch } from "@stencil/core";
import { MODEL_CHAIN_PREFIX } from "../../constants";
import { ControllerBindingService } from "../../services";
import { getClosestParentElement } from "../../utils";

import { getSlotContent } from "./wcc-if-utils";

const TRUE_CONDITION_SLOT_NAME = "true";
const FALSE_CONDITION_SLOT_NAME = "false";

@Component({
  tag: "wcc-if",
})
export class WccIf {
  /**
   * The condition that will be evaluated in order to check which slots will be visible
   */
  @Prop()
  condition: any | undefined = undefined;

  /**
   * An optional modal that will be used to check the condition;
   * if not provided, then the component will find the closes wcc-bindable element and take the model from there
   */
  @Prop()
  model: any | undefined = undefined;

  private falseSlot = null;
  private trueSlot = null;

  @State()
  localModel: any;

  @State()
  conditionValue: boolean = false;

  @Element() host: HTMLElement;

  async componentWillLoad() {
    if (!this.host.isConnected) {
      return;
    }

    const children = Array.from(this.host.children);

    this.trueSlot = getSlotContent(children, TRUE_CONDITION_SLOT_NAME);
    this.falseSlot = getSlotContent(children, FALSE_CONDITION_SLOT_NAME);

    if (!this.trueSlot && !this.falseSlot) {
      this.trueSlot = children.map((child) => child.outerHTML).join("");
    }

    this.host.innerHTML = "";

    this.updateConditionValue();
  }

  async componentDidRender() {
    if (this.localModel) {
      this.bindModelToVisibleSlot(this.host, this.localModel);
    }
  }

  @Watch("model")
  modelWatchHandler(newValue: any) {
    this.localModel = newValue;
    this.updateConditionValue();
  }

  private bindModelToVisibleSlot(element: Element, model: any) {
    for (let i = 0; i < element.children.length; i++) {
      const target = element.children[i];

      ControllerBindingService.bindModel(target, model);
      ControllerBindingService.bindAttributes(target, model);

      if (target.children) {
        this.bindModelToVisibleSlot(target, model);
      }
    }
  }

  private async updateConditionValue() {
    let mustSubscribeToChanges = false;
    if (!this.model) {
      // no model was specified via Props so we must find the closes wcc-bindable
      const wccBindable = getClosestParentElement(
        this.host,
        "wcc-bindable"
      ) as any;
      if (wccBindable) {
        const model = await wccBindable.getModel();
        mustSubscribeToChanges = !this.localModel || this.localModel != model;
        this.localModel = model;
      }
    }

    if (this.condition && this.condition.startsWith(MODEL_CHAIN_PREFIX)) {
      const conditionChain = this.condition.slice(1);
      this.conditionValue = this.localModel.getChainValue(conditionChain);

      if (mustSubscribeToChanges) {
        this.localModel.onChange(conditionChain, (_) => {
          this.conditionValue = this.localModel.getChainValue(conditionChain);
        });
      }
    }
  }

  render() {
    return (
      <div innerHTML={this.conditionValue ? this.trueSlot : this.falseSlot} />
    );
  }
}
