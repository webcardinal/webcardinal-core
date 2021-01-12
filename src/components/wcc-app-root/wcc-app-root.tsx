import { Component, h, Prop, State } from '@stencil/core';
import { RouterHistory, injectHistory } from '@stencil/router';

import { ApplicationController } from '../../controllers';
import { HostElement } from "../../decorators";
import { ControllerRegistryService } from '../../services';

@Component({
  tag: 'wcc-app-root',
  styleUrls: {
    default: '../../styles/wcc-app-root/wcc-app-root.scss'
  },
  shadow: true
})
export class WccAppRoot {
  @HostElement() host: HTMLElement;

  @Prop({ attribute: 'controller' }) controllerName: string | null;

  @Prop() history: RouterHistory;

  @Prop() loaderElement: HTMLElement;

  @State() hasSlot: boolean = false;

  @State() disconnected: boolean = false;

  private _createLoader = () => {
    // TODO: make a wcc-spinner
    // + a renderer for personalization

    const NR_CIRCLES = 12;
    let circles = "";

    for (let i = 1; i <= NR_CIRCLES; i++) {
      circles += `<div class="sk-circle${i} sk-circle"></div>`
    }

    let node = document.createElement("div");
    node.className = "app-loader";
    node.innerHTML = `<div class='sk-fading-circle'>${circles}</div>`;

    return node;
  }

  connectedCallback() {
    this.disconnected = false;
  }

  disconnectedCallback() {
    this.disconnected = true;
  }

  async componentWillLoad() {
    if (this.host.parentElement) {
      this.loaderElement = this._createLoader();
      this.host.parentElement.appendChild(this.loaderElement);
    }

    let innerHTML = this.host.innerHTML;
    innerHTML = innerHTML.replace(/\s/g, '');
    if (innerHTML.length) {
      this.hasSlot = true;
    }

    if (typeof this.controllerName === 'string') {
      try {
        let Controller = await ControllerRegistryService.getController(this.controllerName);

        // Prevent execution if the node has been removed from DOM
        if (!this.disconnected) {
          new Controller(this.host);
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      // load default controller
      new ApplicationController(this.host);
    }
  }

  async componentDidLoad() {
    if (this.loaderElement) {
      this.loaderElement.remove();
    }
  }

  render() {
    if (!this.hasSlot) {
      this.host.innerHTML = `
        <wcc-app-menu></wcc-app-menu>
        <wcc-app-container></wcc-app-container>
      `;
    }

    return <slot/>;
  }
}

injectHistory(WccAppRoot);
