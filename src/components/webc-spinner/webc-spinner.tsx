import { Component, h } from '@stencil/core';

@Component({
  tag: 'webc-spinner',
  styleUrls: {
    default: '../../styles/webc-spinner/webc-spinner.scss',
  },
  shadow: true,
})
export class WebcSpinner {
  render() {
    return (
      <div class="circle-fade">
        {[...Array(9).keys()].map(index => (
          <div class={`circle circle-${index}`} />
        ))}
      </div>
    );
  }
}
