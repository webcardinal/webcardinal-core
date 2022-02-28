import { Component, Host, h, Prop } from '@stencil/core';
import { HTMLStencilElement } from '@stencil/core/internal';

import { HostElement } from '../../decorators';

@Component({
  tag: 'webc-switch',
  shadow: true,
})
export class WebcSwitch {
  @HostElement() host: HTMLStencilElement;

  @Prop() condition: string;

  render() {
    return (
      <Host>
        {this.condition === 'default' ? <slot/> : <slot name={this.condition} />}
      </Host>
    );
  }
}
