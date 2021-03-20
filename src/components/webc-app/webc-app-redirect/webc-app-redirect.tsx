import { Component, Prop, State } from '@stencil/core';
import { injectHistory, RouterHistory } from '@stencil/router';
import { HostElement } from '../../../decorators';

/**
 * @disable cheatsheet
 */
@Component({
  tag: 'webc-app-redirect',
})
export class WebcAppRedirect {
  @HostElement() host: HTMLElement;

  /**
   * Redirects to the specified URL.
   */
  @Prop() url: string = '';

  @State() history: RouterHistory;

  componentWillLoad() {
    if (this.url) {
      this.history.push(this.url, {});
    } else {
      console.warn('Url was not provided!\n', this.host);
    }
  }
}

injectHistory(WebcAppRedirect);
