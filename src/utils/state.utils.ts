import type { EventEmitter } from '@stencil/core';

import { RoutingState } from '../interfaces';
import { promisifyEventEmit } from './promisify';
import { getTranslationsFromState } from './path.utils';

// WebCardinal State

export function resolveEnableTranslationState(self: { disableTranslations: boolean }) {
  // /**
  //  * If this flag is specified, when translations are enabled, it will disable binding and loading of translations.
  //  */
  // @Prop({ reflect: true }) disableTranslations: boolean = false;

  return !self.disableTranslations && getTranslationsFromState();
}

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
