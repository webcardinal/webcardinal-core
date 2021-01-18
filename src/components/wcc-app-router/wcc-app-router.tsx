import { Component, Event, EventEmitter, h, Prop } from '@stencil/core';
import { promisifyEventEmit } from '../../utils';

// TODO: URL Helper Class, for joining origins with multiple paths

@Component({
  tag: 'wcc-app-router'
})
export class WccAppRouter {

  @Prop({ mutable: true }) routes = [];

  @Prop({ mutable: true }) base: string = '';

  @Prop({ mutable: true }) root: string = '';

  @Prop({ mutable: true }) fallback: null;

  @Event({
    eventName: 'webcardinal:config:getRouting',
    bubbles: true, composed: true, cancelable: true
  }) getRoutingConfigEvent: EventEmitter

  private _trimmedPath = (path) => {
    return path.endsWith('/') ? path.slice(0, -1) : path
  };

  private _renderRoute = ({ path, src }) => {
    const props = {
      url: new URL(path).pathname,
      exact: true,
      component: 'wcc-app-loader',
      componentProps: {
        src
      }
    }
    return <stencil-route {...props}/>;
  };

  private _renderRoutes = (routes = [], { path, src } = {
    path: '',
    src: this._trimmedPath(this.base)
  }) => {
    if (!Array.isArray(routes) || routes.length === 0) {
      return null;
    }

    path += '/~dev-route';
    src += '/~dev-source';

    return routes.map(route => {
      const payload = {
        path: this._trimmedPath(new URL(route.path, new URL(path, window.location.origin)).href),
        src:  this._trimmedPath(new URL(route.src,  new URL(src,  window.location.origin)).href)
      }

      if (route.children) {
        return this._renderRoutes(route.children, payload);
      } else {
        return this._renderRoute(payload);
      }
    })
  };

  private _renderFallback = (fallback) => {
    if (!fallback) {
      return null;
    }

    const base = this._trimmedPath(this.base) + '/~dev-fallback';
    const props = {
      component: 'wcc-app-loader',
      componentProps: {
        src: this._trimmedPath(new URL(fallback.src, new URL(base,  window.location.origin)).href)
      }
    }
    return <stencil-route {...props} />
  }

  async componentWillLoad() {
    console.log('WccAppRouter')

    try {
      const routing = await promisifyEventEmit(this.getRoutingConfigEvent);
      this.routes = routing.pages;
      this.root = new URL(routing.baseURL).pathname;
      this.base = new URL(routing.baseURL + routing.pagesPathname).pathname;
      this.fallback = routing.pagesFallback;

      if (this.root === '/') {
        this.root = '';
      }
    } catch (error) {
      console.error(error);
    }
  }

  render() {
    return (
      <stencil-router root={this.root + '/'}>
        <stencil-route-switch scrollTopOffset={0}>
          { this._renderRoutes(this.routes) }
          { this._renderFallback(this.fallback) }
        </stencil-route-switch>
      </stencil-router>
    );
  };
}
