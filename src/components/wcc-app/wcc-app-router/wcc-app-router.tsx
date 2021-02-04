import { Component, Event, EventEmitter, h, Prop } from '@stencil/core';
import { HostElement } from "../../../decorators";
import { ComponentListenersService } from "../../../services";
import { promisifyEventEmit } from '../../../utils';
import { URLHelper } from '../wcc-app-utils';

interface RoutesPayload {
  path: string,
  src: string
}

@Component({
  tag: 'wcc-app-router'
})
export class WccAppRouter {

  @HostElement() host: HTMLElement;

  @Prop({ mutable: true }) routes = [];

  @Prop({ mutable: true }) fallbackPage: null;

  @Prop({ mutable: true }) basePath: string = '';

  @Prop({ mutable: true }) pagesPath: string = '';

  @Event({
    eventName: 'webcardinal:config:getRouting',
    bubbles: true, composed: true, cancelable: true
  }) getRoutingConfigEvent: EventEmitter

  private listeners: ComponentListenersService;
  private tags = {};
  private content = [];

  private _renderRoute = ({ path, src }: RoutesPayload) => {
    const props = {
      url: path,
      exact: true,
      component: 'wcc-app-loader',
      componentProps: { src }
    }
    return <stencil-route data-path={path} data-src={src} {...props}/>;
  };

  private _renderRoutes = (
    routes = [],
    { path, src }: RoutesPayload = { path: '', src: '' },
    routeRenderer = this._renderRoute) =>
  {
    if (!Array.isArray(routes) || routes.length === 0) return null;

    return routes.map(route => {
      let payload = {
        path: URLHelper.join('', path, route.path).pathname,
        src: URLHelper.join('', src, route.src).pathname
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

        if (route.tag) {
          this.tags[route.tag] = payload.path;
        }

        return routeRenderer(payload);
      }
    })
  };

  private _renderFallback = fallback => {
    if (!fallback || !fallback.src) return null;
    const src = URLHelper.join(this.pagesPath, fallback.src).pathname;
    const props = {
      component: 'wcc-app-loader',
      componentProps: { src }
    }
    return <stencil-route data-src={src} {...props} />
  }

  async componentWillLoad() {
    try {
      const routing = await promisifyEventEmit(this.getRoutingConfigEvent);
      this.routes = routing.pages;
      this.fallbackPage = routing.pagesFallback;
      this.basePath = URLHelper.trimEnd(new URL(routing.baseURL).pathname);
      this.pagesPath = URLHelper.trimEnd(new URL(routing.baseURL + routing.pagesPathname).pathname);
      this.content = [
        this._renderRoutes(this.routes),
        this._renderFallback(this.fallbackPage)
      ];
      this.listeners = new ComponentListenersService(this.host, { tags: this.tags });
      this.listeners.getTags.add();
    } catch (error) {
      console.error(error);
    }
  }

  // connectedCallback() {
  //   console.log('connectedCallback')
  //   this.listeners && this.listeners.getTags.add();
  // }
  //
  // disconnectedCallback() {
  //   console.log('disconnectedCallback')
  //   this.listeners && this.listeners.getTags.remove();
  // }

  render() {
    return (
      <stencil-router root={this.basePath + '/'}>
        <stencil-route-switch scrollTopOffset={0}>
          { ...this.content }
        </stencil-route-switch>
      </stencil-router>
    );
  };
}
