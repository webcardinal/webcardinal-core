import type { EventEmitter } from '@stencil/core';
import { HTMLStencilElement } from '@stencil/core/internal';

import { RoutingState } from '../interfaces';
import { promisifyEventEmit } from './promisify';

// WebCardinal State

export function resolveTranslationsState(self: { translations: boolean; host: HTMLStencilElement }): boolean {
  // /**
  //  * If this flag is set it will override the <strong>translations</strong> from <code>webcardinal.json</code>.
  //  */
  // @Prop({ reflect: true }) translations: boolean = false;

  if (!self.host.hasAttribute('translations') && self.host.hasAttribute('enable-translations')) {
    console.warn(
      [`Attribute "enable-translations" is deprecated!`, `Use "translations" instead!`].join('\n'),
      `target:`,
      self.host,
    );
    return true;
  }

  if (self.translations) {
    return true;
  }

  if (
    window.WebCardinal &&
    window.WebCardinal.state &&
    window.WebCardinal.state.activePage &&
    window.WebCardinal.state.activePage.skin &&
    typeof window.WebCardinal.state.activePage.skin.translations === 'boolean'
  ) {
    self.translations ||= window.WebCardinal.state.activePage.skin.translations;
  } else {
    console.error('"translations" can not be obtained from WebCardinal.state!\n');
  }

  return self.translations;
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
