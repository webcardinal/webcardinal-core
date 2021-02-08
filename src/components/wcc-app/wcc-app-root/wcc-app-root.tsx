import { Component, Event, EventEmitter, h, Prop } from "@stencil/core";
import { RouterHistory, injectHistory } from "@stencil/router";
import { ApplicationController } from "../../../controllers";
import { HostElement } from "../../../decorators";
import { promisifyEventEmit } from "../../../utils";
import { subscribeToLogs } from "./wcc-app-root-utils";

@Component({
  tag: "wcc-app-root",
  styleUrls: {
    default: "../../../styles/wcc-app-root/wcc-app-root.scss",
  },
  shadow: true,
})
export class WccAppRoot {
  @HostElement() host: HTMLElement;

  @Prop({ attribute: "loader" }) loaderName: string = "wcc-spinner";

  @Prop() history: RouterHistory;

  @Event({
    eventName: "webcardinal:config:getLogLevel",
    bubbles: true,
    composed: true,
    cancelable: true,
  })
  getLogLevelEvent: EventEmitter;

  private _loaderElement: HTMLElement;

  async componentWillLoad() {
    if (this.host.parentElement && this.loaderName) {
      this._loaderElement = document.createElement(this.loaderName);
      this.host.parentElement.appendChild(this._loaderElement);
    }

    new ApplicationController(this.host);

    if (this.host.children.length === 0) {
      const computedStyles = window.getComputedStyle(this.host);
      const mode = computedStyles.getPropertyValue('--wcc-app-menu-mode').trim();
      this.host.appendChild(Object.assign(document.createElement("wcc-app-menu"), { mode }));
      this.host.setAttribute('layout', mode);
      this.host.appendChild(document.createElement("wcc-app-container"));
    }

    await this.registerAppErrorComponentAndListeners();
  }

  async componentDidLoad() {
    this._loaderElement.remove();
  }

  render() {
    return <slot />;
  }

  private async registerAppErrorComponentAndListeners() {
    this.host.appendChild(document.createElement("wcc-app-error-toast"));

    try {
      const logLevel = await promisifyEventEmit(this.getLogLevelEvent);
      console.log("LogLevel:", logLevel);
      subscribeToLogs(logLevel);
    } catch (error) {
      console.error(error);
    }
  }
}

injectHistory(WccAppRoot);
