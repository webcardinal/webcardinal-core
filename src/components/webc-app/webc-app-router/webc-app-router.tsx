import type { EventEmitter } from '@stencil/core';
import { Component, Event, h, Prop } from '@stencil/core';
import { HostElement } from '../../../decorators';
import { ComponentListenersService } from '../../../services';
import { promisifyEventEmit } from '../../../utils';
import { URLHelper } from '../webc-app-utils';

interface RoutesPayload {
  path: string
  src: string
  loader?: string
}

@Component({
  tag: 'webc-app-router',
})
export class WebcAppRouter {
  @HostElement() host: HTMLElement;

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
   *    <base href="/my-custom-base">
   *   </psk-code>
   * </psk-example>
   *
   * Both <code>webc-app-router</code> and <code>webc-app-menu</code> must share the same <code>basePath</code>.
   */
  @Prop({ mutable: true }) basePath = '';

  /**
   * Path to <code>/pages</code> folder.<br>
   * This folder can be changed from <code>webcardinal.json</code>, using <code>pagesPathname</code>.
   */
  @Prop({ mutable: true }) pagesPath = '/pages';

  /**
   * Routing configuration received from <code>ApplicationController</code>.<br>
   * This configuration includes different settings for pages, skins, modals, etc.;
   */
  @Event({
    eventName: 'webcardinal:config:getRouting',
    bubbles: true,
    composed: true,
    cancelable: true,
  })
  getRoutingConfigEvent: EventEmitter;

  private listeners: ComponentListenersService;
  private tags = {};
  private content = [];
  private mapping = {};
  private pagesPathRegExp: RegExp;

  private _renderRoute = ({ path, src, loader }: RoutesPayload) => {
    const props = {
      url: path,
      exact: true,
      component: 'webc-app-loader',
      componentProps: { src, loader },
    };
    return <stencil-route {...props} />;
  };

  private _renderRoutes = (
    routes = [],
    { path, src }: RoutesPayload = { path: '', src: '' },
    routeRenderer = this._renderRoute,
  ) => {
    if (!Array.isArray(routes) || routes.length === 0) return null;

    return routes.map(route => {
      const payload: RoutesPayload = {
        path: URLHelper.join('', path, route.path).pathname,
        src: URLHelper.join('', src, route.src).pathname,
      }
      if (route.children) {
        return this._renderRoutes(route.children, payload);
      } else {
        payload.path = URLHelper.join(this.basePath, payload.path).pathname;
        if (payload.path === '') payload.path = '/';

        if (route.src.startsWith('http')) {
          payload.src = route.src;
        } else {
          payload.src = URLHelper.join(this.pagesPath, payload.src).pathname;
        }

        this.mapping[payload.path] = payload.src.replace(this.pagesPathRegExp, '');

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
    const src = URLHelper.join(this.pagesPath, fallback.src).pathname;
    const props = {
      component: 'webc-app-loader',
      componentProps: { src },
    };
    return <stencil-route data-src={src} {...props} />;
  };

  async componentWillLoad() {
    try {
      const routing = await promisifyEventEmit(this.getRoutingConfigEvent);
      this.routes = routing.pages;
      this.fallbackPage = routing.pagesFallback;
      this.basePath = URLHelper.trimEnd(new URL(routing.baseURL).pathname);
      this.pagesPath = URLHelper.trimEnd(new URL(routing.baseURL + routing.pagesPathname).pathname);
      this.pagesPathRegExp = new RegExp(`^(${this.pagesPath.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\)`);
      this.content = [this._renderRoutes(this.routes), this._renderFallback(this.fallbackPage)];
      const skinsPath = URLHelper.trimEnd(new URL(routing.baseURL + routing.skinsPathname).pathname);
      this.listeners = new ComponentListenersService(this.host, {
        tags: this.tags,
        routing: {
          basePath: this.basePath,
          pagesPath: this.pagesPath,
          skinsPath,
          mapping: this.mapping,
        },
      });
      this.listeners.getTags.add();
      this.listeners.getRouting.add();
    } catch (error) {
      console.error(error);
    }
  }

  render() {
    return (
      <stencil-router root={this.basePath + '/'}>
        <stencil-route-switch scrollTopOffset={0}>{...this.content}</stencil-route-switch>
      </stencil-router>
    );
  }
}
