import { Component, Event, EventEmitter, h, Prop } from '@stencil/core';
// import { promisifyEventEmit } from '../../utils';

@Component({
  tag: 'wcc-link',
  shadow: true
})
export class WccLink {

  @Prop({ mutable: true }) href: string | null;

  @Prop() tag: string | null;

  @Event({
    eventName: 'webcardinal:tags:get',
    bubbles: true, composed: true, cancelable: true
  }) getTagsEvent: EventEmitter;

  async componentWillLoad() {
    try {
      // const path = await promisifyEventEmit(this.getTagsEvent, { tag: this.tag });
      this.getTagsEvent.emit({
        tag: this.tag,
        callback: (error, path) => {
          if (error) {
            console.error(error);
          }
          console.log({ path });
          this.href = path;
        }
      });
    } catch (error) {
      console.error(error);
    }
  }

  render() {
    return (
      <a href={this.href}>
        <slot />
      </a>
    );
  }
}
