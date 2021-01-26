import { Component, Event, EventEmitter, h, Prop } from '@stencil/core';
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

  @Prop({ mutable: true }) routes = [];

  @Prop({ mutable: true }) fallbackPage: null;

  @Prop({ mutable: true }) basePath: string = '';

  @Prop({ mutable: true }) pagesPath: string = '';

  @Event({
    eventName: 'webcardinal:config:getRouting',
    bubbles: true, composed: true, cancelable: true
  }) getRoutingConfigEvent: EventEmitter

  private _renderRoute = ({ path, src }: RoutesPayload) => {
    let url = URLHelper.join(this.basePath, path).pathname;
    if (url === '') url = '/';
    src = URLHelper.join(this.pagesPath, src).pathname;

    const props = {
      url,
      exact: true,
      component: 'wcc-app-loader',
      componentProps: { src }
    }
    return <stencil-route data-path={url} data-src={src} {...props}/>;
  };

  private _renderRoutes = (
    routes = [],
    { path, src }: RoutesPayload = { path: '', src: '' },
    routeRenderer = this._renderRoute) =>
  {
    if (!Array.isArray(routes) || routes.length === 0) return null;

    return routes.map(route => {
      const payload = {
        path: URLHelper.join('', path, route.path).pathname,
        src: URLHelper.join('', src, route.src).pathname
      }

      if (route.children) {
        return this._renderRoutes(route.children, payload);
      } else {
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
    } catch (error) {
      console.error(error);
    }
  }

  render() {
    return (
      <stencil-router root={this.basePath + '/'}>
        <stencil-route-switch scrollTopOffset={0}>
          { this._renderRoutes(this.routes) }
          { this._renderFallback(this.fallbackPage) }
        </stencil-route-switch>
      </stencil-router>
    );
  };
}
