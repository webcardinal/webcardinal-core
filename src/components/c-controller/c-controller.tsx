import { Component, h, Prop, State } from '@stencil/core';
import { RouterHistory, injectHistory } from '@stencil/router';

import { HostElement } from '../../decorators';
import { ControllerRegistryService } from '../../services';

import DefaultContainerController from '../../../base/controllers/ContainerController';

@Component({
  tag: "c-controller"
})
export class CController {
  @HostElement() private host: HTMLElement;

  @Prop() name?: string | null;

  @Prop() history: RouterHistory;

  @State() disconnected: boolean | false;

  private controller;

  connectedCallback() {
    this.disconnected = false;
  }
  disconnectedCallback() {
    this.disconnected = true;
  }

  async componentWillLoad() {
    if (typeof this.name === 'string') {
      try {
        const Controller = await ControllerRegistryService.getController(this.name);

        // Prevent javascript execution if the node has been removed from DOM
        if (!this.disconnected) {
          this.controller = new Controller(this.host, this.history);
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      // load default controller
      this.controller = new DefaultContainerController(this.host);
    }

    console.log({ controller: this.controller });
    this.bindExecution(this.host);
  }

  private bindExecution = (node: Element) => {

    const isNativeProperty = (key) => {
      return [
        'value',
        'innerText',
        'innerHTML'
      ].includes(key);
    }

    const getModelKeys = (node: Element) => {
      const keys = node.getAttribute('model').split('.');
      if (keys[0].startsWith('@')) {
        keys[0] = keys[0].slice(1);
      }
      return keys
    }

    const getBondedModel = (model, keys) => {
      if (keys.length > 1) {
        return getBondedModel(model[keys[0]], keys.slice(1));
      }
      return model[keys[0]];
    }

    for (let i = 0; i < node.children.length; i++) {
      let child = node.children[i];

      if (child.getAttribute('model')) {
        const { model: controllerModel } = this.controller;
        const keys = getModelKeys(child);
        const model = getBondedModel(controllerModel, keys);

        for (const [key, value] of Object.entries(model)) {
          if (typeof value === 'object') {
            continue;
          }

          if (isNativeProperty(key)) {
            child[key] = value;
            continue;
          }

          if (typeof value !== 'string') {
            continue;
          }

          if (key === 'class') {
            child.classList.add(value);
            continue;
          }

          child.setAttribute(key, value);
        }
      }

      if (child.children) {
        this.bindExecution(child);
      }
    }
  }

  render() {
    return <slot/>;
  }

}
injectHistory(CController);
