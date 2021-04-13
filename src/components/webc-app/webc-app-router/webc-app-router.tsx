import { Component, Event, EventEmitter, h, Prop, State } from '@stencil/core';

import { PAGES_PATH } from '../../../constants';
import { HostElement } from '../../../decorators';
import { ComponentListenersService } from '../../../services';
import { promisifyEventEmit, URLHelper } from '../../../utils';

const { join, trimEnd } = URLHelper;

interface RoutesPayload {
  path: string;
  src: string;
  loader?: string;
  skin?: string;
  translations?: boolean;
}

function isSSAppContext() {
  return (
    window.$$ && window.$$.SSAPP_CONTEXT && window.$$.SSAPP_CONTEXT.BASE_URL
    // && window.$$.SSAPP_CONTEXT.SEED
    // It is not always received
  );
}

@Component({
  tag: 'webc-app-router',
})
export class WebcAppRouter {
  @HostElement() host: HTMLElement;

  @State() landingPage = null;

  /**
   * This Array is received from <code>ApplicationController</code>.
   */
  @Prop({ mutable: true }) routes = [];

  /**
   * Similar to 404 page, if <code>window.location.href</code> does not match any page, this fallback will be shown.
   * This page can be changed from <code>webcardinal.json</code>, using <code>pagesFallback</code>.
   */
  @Prop({ mutable: true }) fallbackPage;

  /**
   * There is the possibility to change the base path of your application, using <code>base</code> HTML Element:
   * <psk-example>
   *   <psk-code>
   *    <base href="/my-custom-base/sub-path/">
   *   </psk-code>
   * </psk-example>
   *
   * Both <code>webc-app-router</code> and <code>webc-app-menu</code> must share the same <code>basePath</code>.
   */
  @Prop({ mutable: true }) basePath = '';

  /**
   * Routing configuration received from <code>ApplicationController</code>.<br>
   * This configuration includes different settings for pages, skins, modals, etc.;
   */
  @Event({
    eventName: 'webcardinal:config:getRouting',
    bubbles: true,
    cancelable: true,
    composed: true,
  })
  getRoutingConfigEvent: EventEmitter;

  private listeners: ComponentListenersService;
  private tags = {};
  private content = [];
  private mapping = {};
  private pagesPathRegExp: RegExp;

  private _renderRoute = ({ path, src, loader, skin, translations }: RoutesPayload) => {
    const props = {
      url: path,
      exact: true,
      component: 'webc-app-loader',
      componentProps: { src, loader, skin, translations, basePath: this.basePath },
    };

    // fix regarding WebCardinal in a non-updated location context of an iframe
    if (props.url === '/' && isSSAppContext()) {
      const propsClone = {
        ...props,
        url: window.location.pathname,
        componentProps: { url: '/' },
      };
      propsClone.component = 'webc-app-redirect';
      this.content.push(<stencil-route data-path={propsClone.url} data-redirect {...propsClone} />);
    }

    return <stencil-route data-path={props.url} data-src={src} {...props} />;
  };

  private _renderRoutes = (
    routes = [],
    { path, src }: RoutesPayload = { path: '', src: '' },
    routeRenderer = this._renderRoute,
  ) => {
    if (!Array.isArray(routes) || routes.length === 0) return null;

    return routes.map(route => {
      const payload: RoutesPayload = {
        path: join('', path, route.path).pathname,
        src: join('', src, route.src).pathname,
        skin: route?.skin?.name || 'none'
      };

      if (typeof route.skin?.translations === 'boolean') {
        payload.translations = route?.skin?.translations;
      }

      if (route.children) {
        return this._renderRoutes(route.children, payload);
      } else {
        if (payload.path === '') payload.path = '/';

        if (route.src.startsWith('http')) {
          payload.src = route.src;
        } else {
          payload.src = '.' + join(PAGES_PATH, payload.src).pathname;
        }

        let joinedPath = join(this.basePath, payload.path).pathname;
        this.mapping[joinedPath] = payload.src.replace(this.pagesPathRegExp, '');

        if (route.tag) {
          this.tags[route.tag] = payload.path;
        }

        if (route.loader) {
          payload.loader = route.loader;
        }

        return routeRenderer(payload);
      }
    });
  };

  private _renderFallback = fallback => {
    if (!fallback || !fallback.src) return null;
    const src = '.' + join(PAGES_PATH, fallback.src).pathname;
    const loader = fallback.loader || 'default';
    const skin = fallback?.skin?.name || 'none';
    const translations = fallback?.skin?.translations;
    const props = {
      component: 'webc-app-loader',
      componentProps: { src, loader, skin, translations, basePath: this.basePath },
    };
    return <stencil-route data-src={src} {...props} />;
  };

  private __manageLandingPage = () => {
    // fix regarding WebCardinal in a non-updated location context of an psk-ssapp
    if (window && window.frameElement && window.frameElement.hasAttribute('landing-page')) {
      this.landingPage = window.frameElement.getAttribute('landing-page');
    }

    if (this.landingPage) {
      if (isSSAppContext()) {
        // if we have a BASE_URL then we prefix the redirectPath url with BASE_URL
        const baseUrlPathname = new URL(window.$$.SSAPP_CONTEXT.BASE_URL).pathname;
        this.landingPage = `${baseUrlPathname}${
          this.landingPage.indexOf('/') === 0 ? this.landingPage.substring(1) : this.landingPage
        }`;
      }

      const props = {
        url: window.location.pathname,
        exact: true,
        component: 'webc-app-redirect',
        componentProps: { url: this.landingPage },
      };
      this.content.push(<stencil-route data-path={props.url} data-redirect {...props} />);
    }
  };

  async componentWillLoad() {
    try {
      const routing = await promisifyEventEmit(this.getRoutingConfigEvent);
      this.routes = routing.pages;
      this.fallbackPage = routing.pagesFallback;
      this.basePath = trimEnd(new URL(routing.baseURL).pathname);

      this.pagesPathRegExp = new RegExp(`^(${PAGES_PATH.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\)`);

      this.__manageLandingPage();

      this.content.push(this._renderRoutes(this.routes), this._renderFallback(this.fallbackPage));

      this.listeners = new ComponentListenersService(this.host, {
        tags: this.tags,
        routing: { basePath: this.basePath, mapping: this.mapping },
      });
      this.listeners.getTags.add();
      this.listeners.getRouting.add();
    } catch (error) {
      console.error(error);
    }
  }

  render() {
    return (
      <stencil-router data-root={this.basePath + '/'} root={this.basePath + '/'}>
        <stencil-route-switch scrollTopOffset={0}>{...this.content}</stencil-route-switch>
      </stencil-router>
    );
  }
}
