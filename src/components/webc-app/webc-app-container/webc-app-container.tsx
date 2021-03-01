import { Component, h } from '@stencil/core';
import { HostElement } from '../../../decorators';

/**
 * This web component is a wrapper over your application, more precise over <code>webc-app-router</code>.
 *
 * @slot - your content or if nothing, your routing point <code>webc-app-router</code>;
 * @slot before - content that goes behind this component in the DOM;
 * @slot after - place for final content;
 */
@Component({
  tag: 'webc-app-container',
  styleUrls: {
    default: '../../../styles/webc-app-container/webc-app-container.scss',
  },
})
export class WebcAppContainer {
  @HostElement() host: HTMLElement;

  private slots = {
    before: false,
    after: false,
    unnamed: false,
  };

  async componentWillLoad() {
    // manage slots
    this.slots.unnamed = this.host.children.length > 0;
    for (const key of Object.keys(this.slots)) {
      if (this.host.querySelector(`[slot=${key}]`)) {
        this.slots[key] = true;
        this.host.classList.add(`slot-${key}`);
      } else {
        this.host.classList.remove(`slot-${key}`);
      }
    }
  }

  render() {
    return [
      this.slots.before ? (
        <div class="container before">
          <slot name="before" />
        </div>
      ) : null,
      <div class="container app-container">{this.slots.unnamed ? <slot /> : <webc-app-router />}</div>,
      this.slots.after ? (
        <div class="container after">
          <slot name="after" />
        </div>
      ) : null,
    ];
  }
}
