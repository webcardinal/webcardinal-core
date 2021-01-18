import { Component, h } from '@stencil/core';

@Component({
  tag: 'wcc-spinner',
  styleUrls: {
    default: '../../styles/wcc-spinner/wcc-spinner.scss'
  },
  shadow: true
})
export class WccSpinner {
  render() {
    return (
      <div class="circle-fade">
        { [...Array(9).keys()].map(index => <div class={`circle circle-${index}`}/>) }
      </div>
    );
  }
}
