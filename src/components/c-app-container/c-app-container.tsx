import { Component, Element, h } from '@stencil/core';

@Component({
  tag: 'c-app-container',
  styleUrls: {
    default: '../../styles/c-app-container/c-app-container.scss'
  }
})
export class CAppContainer {
  @Element() host: HTMLElement;

  private slots = {
    before: false,
    after: false,
    unnamed: false,
  }

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
      ( this.slots.before
        ? <div class="container before">
            <slot name="before"/>
          </div>
        : null
      ),
      <div class="container app-container">
        { this.slots.unnamed ? <slot/> : <c-app-router/> }
      </div>,
      ( this.slots.after
        ? <div class="container after">
            <slot name="after"/>
          </div>
        : null
      )
    ];
  }
}
