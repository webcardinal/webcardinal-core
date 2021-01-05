import { Component, Element, Event, EventEmitter, h, Prop } from '@stencil/core';
import { promisifyEventEmit } from '../../utils';

@Component({
  tag: 'c-app-menu',
  styleUrls: {
    vertical: '../../styles/c-app-menu/c-app-menu.vertical.scss',
    horizontal: '../../styles/c-app-menu/c-app-menu.horizontal.scss'
  }
})
export class CAppMenu {
  @Element() host: HTMLElement;

  @Prop() items = [];

  private slots = {
    before: false,
    after: false
  }
  private modes = Object.keys(this._menu);
  private defaultMode = this.modes[0];

  @Prop({ reflect: true, mutable: true }) mode = this.defaultMode;

  @Event({
    eventName: 'cardinal:config:getRouting',
    bubbles: true, composed: true, cancelable: true
  }) getRoutingConfigEvent: EventEmitter

  async componentWillLoad() {
    // get items
    if (this.items.length === 0) {
      try {
        const routing = await promisifyEventEmit(this.getRoutingConfigEvent);
        this.items = routing.pages;
      } catch (error) {
        console.error(error);
      }
    }

    // manage modes
    if (!this.modes.includes(this.mode)) {
      console.warn('c-app-menu', `You should use one of the following modes: ${this.modes.join(', ')}`);
      this.mode = this.defaultMode;
    }
    this.host.parentElement.setAttribute('layout', this.mode);

    // manage slots
    for (const key of Object.keys(this.slots)) {
      if (this.host.querySelector(`[slot=${key}]`)) {
        this.slots[key] = true;
        this.host.classList.add(`slot-${key}`);
      } else {
        this.host.classList.remove(`slot-${key}`);
      }
    }
  }

  private get _menu() {
    const renderMenu = () => {
      return [
        ( this.slots.before
          ? <div class="container before">
              <slot name="before"/>
            </div>
          : null
        ),
        <div class="container app-menu items">
          { this.items.map(item => item.indexed ? <c-app-menu-item item={item}/> : null) }
        </div>,
        ( this.slots.after
          ? <div class="container after">
              <slot name="after"/>
            </div>
          : null
        )
      ]
    }

    return {
      vertical: renderMenu(),
      horizontal: renderMenu()
    }
  }

  render() {
    return this._menu[this.mode];
  }
}

