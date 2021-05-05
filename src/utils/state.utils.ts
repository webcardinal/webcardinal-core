import { EventEmitter } from '@stencil/core';

import { RoutingState } from '../interfaces';
import { promisifyEventEmit } from './promisify';

// WebCardinal State

export async function resolveRoutingState(self: {
  getRoutingStateEvent: EventEmitter<RoutingState>;
}): Promise<RoutingState | null> {
  // /**
  //  * Routing configuration received from <code>webc-app-router</code>.
  //  */
  // @Event({
  //   eventName: 'webcardinal:routing:get',
  //   bubbles: true,
  //   cancelable: true,
  //   composed: true,
  // })
  // getRoutingStateEvent: EventEmitter<RoutingState>;

  try {
    return await promisifyEventEmit(self.getRoutingStateEvent);
  } catch (error) {
    console.error('Routing configuration can not be obtained from "webc-app-loader"!\n', error);
    return null;
  }
}
