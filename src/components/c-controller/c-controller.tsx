import { Component, Element, h, Prop, State} from '@stencil/core';
import { RouterHistory, injectHistory } from '@stencil/router';

import { ControllerRegistryService } from '../../services';
import DefaultContainerController from '../../../base/controllers/ContainerController';

@Component({
  tag: "c-controller"
})
export class CController {
  @Element() private host: HTMLElement;

  @Prop() name?: string | null;
  @Prop() history: RouterHistory;

  // @State() controller: any | null;
  // @State() controllerScript: string | null;
  @State() disconnected: boolean | false;

  connectedCallback() {
    this.disconnected = false;
  }
  disconnectedCallback() {
    this.disconnected = true;
  }

  async componentWillLoad() {
    if (typeof this.name === 'string') {
      try {
        let Controller = await ControllerRegistryService.getController(this.name);

        // Prevent javascript execution if the node has been removed from DOM
        if (!this.disconnected) {
          new Controller(this.host, this.history);
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      // load default controller
      new DefaultContainerController(this.host);
    }
  }

  render() {
    return <slot/>;
  }

}
injectHistory(CController);
