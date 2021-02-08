import { Component, Event, EventEmitter, h, Prop } from "@stencil/core";
import { RouterHistory } from "@stencil/router";
import { HostElement } from "../../decorators";
import { MODEL_KEY, SKIP_BINDING_FOR_COMPONENTS } from "../../constants";
import {
  ControllerBindingService,
  ControllerRegistryService,
} from "../../services";
import { promisifyEventEmit, extractChain } from "../../utils";

@Component({
  tag: "wcc-for",
  shadow: true,
})
export class WccFor {
  @HostElement() host: HTMLElement;

  @Prop() history: RouterHistory;

  @Prop({ attribute: "controller" }) controllerName: string | null;

  @Prop({ attribute: "data-model" }) chain: string = "";

  @Prop() autoBind: boolean = true;

  @Event({
    eventName: "webcardinal:model:get",
    bubbles: true,
    composed: true,
    cancelable: true,
  })
  getModelEvent: EventEmitter;

  private template = [];
  private controller;
  private model;
  private bindRelativeModel = (element, index) => {
    let tag = element.tagName.toLowerCase();
    let chainSuffix = extractChain(element);
    if (chainSuffix) {
      chainSuffix = chainSuffix.slice(1);
      element.setAttribute(
        MODEL_KEY,
        [this.chain, index, chainSuffix].join(".")
      );
    } else if (this.autoBind === true) {
      element.setAttribute(MODEL_KEY, [this.chain, index].join("."));
    }

    if (SKIP_BINDING_FOR_COMPONENTS.includes(tag)) {
      return;
    }

    ControllerBindingService.bindModel(element, this.model);
    ControllerBindingService.bindAttributes(element, this.model);

    if (element.children) {
      Array.from(element.children).forEach((child) =>
        this.bindRelativeModel(child, index)
      );
    }
  }

  private _handleTemplate() {
    const chain = this.chain.slice(1);
    const renderTemplate = () => {
      if (!this.model) return;

      const model = this.model.getChainValue(chain);
      if (!Array.isArray(model)) {
        console.error(
          `Attribute "${MODEL_KEY}" must be an array in the model!`
        );
        return;
      }

      for (let i = 0; i < model.length; i++) {
        for (let node of this.template) {
          const element = node.cloneNode(true) as HTMLElement;
          this.bindRelativeModel(element, i);

          this.host.appendChild(element);
        }
      }
    };

    renderTemplate();

    this.model.onChange(chain, () => {
      this.host.innerHTML = "";
      renderTemplate();
    });
  }

  async componentWillLoad() {
    if (!this.host.isConnected) {
      return;
    }

    // validate chain
    this.chain = extractChain(this.host);

    // get specific model (from controller or parent node)
    if (typeof this.controllerName === "string") {
      try {
        const Controller = await ControllerRegistryService.getController(
          this.controllerName
        );
        if (this.host.isConnected) {
          this.controller = new Controller(this.host, this.history);
          if (this.controller.model) {
            this.model = this.controller.model;
          }
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      try {
        this.model = await promisifyEventEmit(this.getModelEvent);
      } catch (error) {
        console.error(error);
      }
    }

    // save the template for each item of array
    while (this.host.children.length > 0) {
      this.template.push(this.host.children[0]);
      this.host.children[0].remove();
    }

    this._handleTemplate();
  }

  render() {
    return <slot />;
  }
}
