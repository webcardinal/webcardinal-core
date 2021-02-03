import { Component, Event, EventEmitter, Host, h, Prop } from '@stencil/core';
import { promisifyEventEmit } from '../../../utils';

@Component({
  tag: 'wcc-app-identity',
  styleUrls: {
    default: '../../../styles/wcc-app-identity/wcc-app-identity.scss'
  },
  shadow: true
})
export class WccAppIdentity {
  @Prop({ mutable: true }) avatar: string | null;

  @Prop({ mutable: true }) email: string | null;

  @Prop({ mutable: true }) name: string | null;

  @Event({
    eventName: 'webcardinal:config:getIdentity',
    bubbles: true, composed: true, cancelable: true
  }) getIdentityConfigEvent: EventEmitter;

  async componentWillLoad() {
    try {
      const identity = await promisifyEventEmit(this.getIdentityConfigEvent);
      this.avatar = identity.avatar;
      this.email = identity.email;
      this.name = identity.name;
    } catch (error) {
      console.error(error);
    }
  }

  render() {
    const attributes = {
      class: {
        'has-avatar': !!this.avatar
      }
    }

    return (
      <Host {...attributes}>
        { this.avatar ? <img src={this.avatar} alt={this.name} /> : null }
        <div class="name">{this.name}</div>
        <div class="email">{this.email}</div>
      </Host>
    )
  }
}
