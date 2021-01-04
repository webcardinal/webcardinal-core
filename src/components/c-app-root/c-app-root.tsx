import { Component, Element, h, Prop, State } from '@stencil/core';

import { ApplicationController } from '../../controllers';
import { ControllerRegistryService } from '../../services';

@Component({
  tag: 'c-app-root',
  styleUrls: {
    default: '../../styles/c-app-root/c-app-root.scss'
  },
  shadow: true
})
export class CAppRoot {
  @Element() host: HTMLElement;

  @Prop() controller: any;

  @State() loaderElement: HTMLElement;

  @State() hasSlot: boolean = false;
  @State() disconnected: boolean = false;

  private _createLoader = () => {
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

    if (typeof this.controller === 'string') {
      try {
        let Controller = await ControllerRegistryService.getController(this.controller);

        // Prevent javascript execution if the node has been removed from DOM
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
    console.log('c-app-root loaded!');

    if (this.loaderElement) {
      this.loaderElement.remove();
    }
  }

  render() {
    if (!this.hasSlot) {
      this.host.innerHTML = `
        <c-app-menu></c-app-menu>
        <c-app-container></c-app-container>
      `;
    }

    return <slot/>;
  }
}
