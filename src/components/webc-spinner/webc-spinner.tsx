import { Component, h } from '@stencil/core';
import type { HTMLStencilElement } from '@stencil/core/internal';

import { HostElement } from '../../decorators';

@Component({
  tag: 'webc-spinner',
  styleUrls: {
    default: '../../styles/webc-spinner/webc-spinner.scss',
  },
})
export class WebcSpinner {
  @HostElement() host: HTMLStencilElement;

  render() {
    this.host.innerHTML = '';

    return (
      <div class="circle-fade">
        {[...Array(9).keys()].map(index => (
          <div class={`circle circle-${index}`} />
        ))}
      </div>
    );
  }
}
