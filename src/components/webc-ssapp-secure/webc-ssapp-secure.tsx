import { Component, Event, EventEmitter, Prop, State, Watch, h } from '@stencil/core';
import { HTMLStencilElement } from '@stencil/core/internal';

import { HostElement } from '../../decorators';

@Component({
  tag: 'webc-ssapp-secure',
  styleUrls: {
    default: '../../styles/webc-ssapp/webc-ssapp.scss',
  },
  shadow: true,
})
export class WebcSsapp {
  @HostElement() element: HTMLStencilElement;

  @Prop({ attribute: 'app-name', mutable: false, reflect: false }) appName: string;

  @Prop({ attribute: 'key-ssi', mutable: false, reflect: false }) seed: string = undefined;

  @Prop({ attribute: 'landing-path', mutable: false, reflect: false }) landingPath: string = '/';

  @Prop({ attribute: 'params', mutable: false, reflect: false }) params: { [indexer: string]: string };

  @Prop({ attribute: 'basic-setup', mutable: false, reflect: false }) basicSetup: boolean = false;

  @State() digestKeySsiHex;

  @State() parsedParams;

  @State() anchorId;

  private eventHandler;

  private componentInitialized = false;

  private iFrame: HTMLIFrameElement;

  @Event({
    bubbles: true,
    cancelable: true,
  })
  windowAction: EventEmitter;

  componentShouldUpdate(newValue, oldValue, changedState) {
    if (newValue !== oldValue && (changedState === 'digestKeySsiHex' || changedState === 'parsedParams')) {
      window.document.removeEventListener(oldValue, this.eventHandler);
      window.document.addEventListener(newValue, this.eventHandler);
      return true;
    }
    return false;
  }

  componentWillLoad(): Promise<any> {
    if (!this.element.isConnected) {
      return;
    }
    return new Promise(resolve => {
      this.componentInitialized = true;
      this.loadApp(resolve);
    });
  }

  componentDidLoad() {
    console.log('#### Trying to register ssapp reference');
    // getInstanceRegistry().addSSAppReference(this.appName, iframe);

    this.eventHandler = this.ssappEventHandler.bind(this);
    window.document.addEventListener(this.digestKeySsiHex, this.eventHandler);
    window.document.addEventListener(this.parsedParams, this.eventHandler);

    console.log(`### Trying to add listener to iframe document`);
    const self = this;
    this.iFrame.addEventListener('load', () => {
      self.iFrame.contentWindow.addEventListener('ssapp-action', self.handleActionFromWindow.bind(self));
    });
  }

  private handleActionFromWindow(evt) {
    evt.preventDefault();
    evt.stopImmediatePropagation();
    const { detail } = evt;
    this.windowAction.emit(detail);
  }

  @Watch('seed')
  @Watch('params')
  @Watch('landingPath')
  async loadApp(callback?) {
    if (!this.seed) return;
    if (this.componentInitialized) {
      this.digestKeySsiHex = this.digestMessage(this.seed);

      const resolver = require('opendsu').loadApi('resolver');
      const dsu = await window.$$.promisify(resolver.loadDSU)(this.seed);
      const dsuKeySSI = await window.$$.promisify(dsu.getKeySSIAsObject)();
      this.anchorId = await window.$$.promisify(dsuKeySSI.getAnchorId)();
      const tokenUrl = new URL(`cloud-wallet/setSSAPPToken/${this.anchorId}`, window.location.origin).href;
      const tokenResponse = await fetch(tokenUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sReadSSI: this.seed,
        }),
      });
      if (!tokenResponse.ok) {
        console.error('Failed to set SSAPP Token!');
      }

      if (typeof callback === 'function') {
        callback();
      }

      if (!!this.params) {
        try {
          this.parsedParams = Object.assign({}, this.params);
        } catch (e) {
          console.log("Attribute called 'params' could not be parsed.");
        }
      }
    }
  }

  private getWindows() {
    let currentWindow: any = window;
    let parentWindow: any = currentWindow.parent;

    while (currentWindow !== parentWindow) {
      currentWindow = parentWindow;

      //we need to prevent cors errors when from a frame with document.domain we are trying to access a frame with a different document.domain
      //CORS related issue fix
      try {
        if (currentWindow.parent.document) {
          parentWindow = currentWindow.parent;
        }
      } catch (e) {}
    }

    return { currentWindow, parentWindow };
  }

  private sendLoadingProgress(progress?: any, status?: any) {
    const { parentWindow } = this.getWindows();

    parentWindow.document.dispatchEvent(
      new CustomEvent('ssapp:loading:progress', {
        detail: {
          progress,
          status,
        },
      }),
    );
  }

  private ssappEventHandler(e) {
    const data = e.detail || {};

    if (data.query === 'seed') {
      this.iFrame.contentWindow.document.dispatchEvent(
        new CustomEvent(this.digestKeySsiHex, {
          detail: {
            seed: this.seed,
          },
        }),
      );
      return;
    }

    if (data.status === 'completed') {
      const signalFinishLoading = () => {
        this.sendLoadingProgress(100);
        this.iFrame.removeEventListener('load', signalFinishLoading);
      };

      this.iFrame.addEventListener('load', signalFinishLoading);
      this.iFrame.contentWindow.location.reload();
    }
  }

  private digestMessage(message) {
    // @ts-ignore
    const crypto = require('opendsu').loadApi('crypto');
    const hash = crypto.sha256(message);
    return hash;
  }

  private getQueryParams() {
    let queryParams = '';
    if (this.parsedParams)
      queryParams += Object.keys(this.parsedParams)
        .map(key => key + '=' + this.parsedParams[key])
        .join('&');

    return queryParams ? '?' + encodeURI(queryParams) : '';
  }

  private getIFrameSrc() {
    let basePath;
    const { currentWindow } = this.getWindows();

    basePath = currentWindow.location.origin + currentWindow.location.pathname;
    basePath = basePath.replace('index.html', '');
    if (basePath[basePath.length - 1] !== '/') basePath += '/';

    // we are in a context in which SW are not enabled so the iframe must be identified by the seed
    const $$ = window['$$'];
    let iframeKeySsi =
      $$.SSAPP_CONTEXT && $$.SSAPP_CONTEXT.BASE_URL && $$.SSAPP_CONTEXT.SEED ? this.anchorId : this.digestKeySsiHex;

    if (this.basicSetup) {
      basePath = '/';
      iframeKeySsi = this.anchorId;
    }

    return basePath + 'iframe/' + iframeKeySsi + this.getQueryParams();
  }

  render() {
    if (!this.seed || !this.anchorId) return;
    
    const iframeSrc = this.getIFrameSrc();
    console.log('Loading sssap in: ' + iframeSrc);
    return (
      <iframe
        landing-page={this.landingPath}
        frameborder="0"
        style={{
          overflow: 'hidden',
          height: '100%',
          width: '100%',
        }}
        src={iframeSrc}
        ref={el => (this.iFrame = el as HTMLIFrameElement)}
      />
    );
  }
}
