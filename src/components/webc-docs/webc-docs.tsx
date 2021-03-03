import { Component, Event, EventEmitter, Host, h, Prop } from '@stencil/core';
import { HostElement } from '../../decorators';
import { promisifyEventEmit } from '../../utils';

/**
 * @slot - Content that goes immediately after "Tag" section and before "Properties" section.
 */
@Component({
  tag: 'webc-docs',
  styleUrls: {
    default: '../../styles/webc-docs/webc-docs.scss',
  },
})
export class WebcContainer {
  @HostElement() private host: HTMLElement;

  /**
   * Component tag name (in lowercase) for which documentation is desired.
   */
  @Prop() for: string;

  /**
   * If this prop is set to <code>true</code> the source of fetched docs for current webc-docs component must be on your
   * local workspace. Otherwise the source is <small><code>https://raw.githubusercontent.com</code></small>.
   */
  @Prop() local?: boolean = false;

  /**
   * Gets the docs source for current component.<br>
   * In <code>webcardinal.json</code>, if there is a key named <code>docsSource</code> with value <code>'local'</code>,
   * all webc-docs components will be configured for local docs.<br>
   * Default value for <code>docsSource</code> is <code>'github'</code>.
   */
  @Event({
    eventName: 'webcardinal:config:getDocsSource',
    bubbles: true,
    composed: true,
    cancelable: true,
  })
  getDocsSourceConfigEvent: EventEmitter;

  private cheatsheet;
  private docs;
  private content = [];

  async componentWillLoad() {
    if (!this.host.isConnected) {
      return;
    }

    try {
      const docsSource = await promisifyEventEmit(this.getDocsSourceConfigEvent);
      if (docsSource === 'local') {
        this.local = true;
      }
    } catch (error) {
      console.error(`"docsSource" can not be obtained from "webcardinal.json"!\n`, error);
      return;
    }

    try {
      let cheatsheetPath = new URL('/docs/cheatsheet.json', window.location.origin).href;
      const response = await fetch(cheatsheetPath);
      this.cheatsheet = await response.json();
    } catch (error) {
      console.error(`"cheatsheet.json" can not be obtained!\n`, error);
      return;
    }

    let component = this.for;
    if (!this.cheatsheet[component]) {
      console.error(`Component "${component}" does not exist in cheatsheet!`);
      return;
    }

    let library = this.cheatsheet[component].source;
    library = library.substr(1).replace('/', '-');

    let origin = `https://raw.githubusercontent.com/webcardinal/${library}/master`;
    if (this.local) {
      origin = new URL(`/.webcardinal/components/${library}`, window.location.origin).href;
      console.warn(`Local docs is active!`);
    }

    let source = `${origin}/docs/custom/components/${component}.json`;
    try {
      let componentDocsPath = new URL(source).href;
      const response = await fetch(componentDocsPath);
      this.docs = await response.json();
    } catch (error) {
      console.error(`Docs for component "${component}" can not be fetched!\n`, error);
      return;
    }
  }

  appendTagAndEncapsulation() {
    const { tag, encapsulation } = this.docs;

    this.content.push(
      <section class="docs-section tag">
        <h1>
          <code>{`<${tag}/>`}</code>
        </h1>
        {encapsulation !== 'none' ? <span class="encapsulation">{encapsulation}</span> : null}
      </section>,
    );
  }

  appendSlot() {
    if (this.host.childNodes.length > 0) {
      this.content.push(<slot />);
    }
  }

  appendSummary() {
    const { docs } = this.docs;
    if (!docs) {
      return;
    }

    this.content.push(
      <psk-description class="docs-section description" title="Summary">
        <p innerHTML={docs} />
      </psk-description>,
    );
  }

  appendProps() {
    const { props } = this.docs;
    if (!props || props.length === 0) {
      return;
    }

    const describeProp = ({ name, docs, attr, type, required, ...rest }) => {
      return (
        <article class="property" data-docs-attribute={attr}>
          <h3>{name}</h3>
          <div class="table">
            {docs ? [<span>Description</span>, <div innerHTML={docs} />] : null}
            {attr
              ? [
                  <span>Attribute</span>,
                  <div>
                    <code>
                      <strong>{attr}</strong>
                    </code>
                  </div>,
                ]
              : null}
            <span>Type</span>
            <div>
              <code>{type}</code>
            </div>
            {/*<span>Required</span>*/}
            {/*<div>*/}
            {/*  <code>{`${required}`}</code>*/}
            {/*</div>*/}
            {rest.default
              ? [
                  <span>Default</span>,
                  <div>
                    <code>{rest.default}</code>
                  </div>,
                ]
              : null}
          </div>
        </article>
      );
    };

    this.content.push(
      <psk-chapter class="docs-section properties" title="Properties">
        {props.map(prop => describeProp(prop))}
      </psk-chapter>,
    );
  }

  appendEvents() {
    const { events } = this.docs;
    if (!events || events.length === 0) {
      return;
    }

    const describeEvent = ({ event, docs }) => {
      return (
        <article class="event" data-docs-event={event}>
          <h3>{event}</h3>
          {docs ? (
            <div class="table">
              <span>Description</span>
              <div innerHTML={docs} />
            </div>
          ) : null}
        </article>
      );
    };

    this.content.push(
      <psk-chapter class="docs-section events" title="Events">
        {events.map(event => describeEvent(event))}
      </psk-chapter>,
    );
  }

  appendMethods() {
    const { methods } = this.docs;
    if (!methods || methods.length === 0) {
      return;
    }

    const describeMethod = ({ name, docs, signature }) => {
      return (
        <article class="method" data-docs-method={name}>
          <h3>{name}</h3>
          <div class="table">
            {docs ? [<span>Description</span>, <div innerHTML={docs} />] : null}
            <span>Signature</span>
            <div>
              <code>{signature}</code>
            </div>
          </div>
        </article>
      );
    };

    this.content.push(
      <psk-chapter class="docs-section methods" title="Methods">
        {methods.map(method => describeMethod(method))}
      </psk-chapter>,
    );
  }

  appendSlots() {
    const { slots } = this.docs;
    if (!slots || slots.length === 0) {
      return;
    }

    const describeSlots = ({ name, docs }) => {
      return [<div data-docs-slot={name}>{name ? <code>{name}</code> : null}</div>, <div innerHTML={docs} />];
    };

    this.content.push(
      <psk-chapter class="docs-section slots" title="Slots">
        <div class="table table-with-head">
          <h3>Name</h3>
          <h3>Description</h3>
          {slots.map(slot => describeSlots(slot))}
        </div>
      </psk-chapter>,
    );
  }

  appendCSSVariables() {
    const { styles } = this.docs;
    if (!styles || styles.length === 0) {
      return;
    }

    const describeStyle = ({ name, docs }) => {
      return [
        <div data-docs-style={name}>
          <code>{name}</code>
        </div>,
        <div innerHTML={docs} />,
      ];
    };

    this.content.push(
      <psk-chapter class="docs-section styles" title="CSS Variables">
        <div class="table table-with-head">
          <h3>Name</h3>
          <h3>Description</h3>
          {styles.map(slot => slot.annotation === 'prop' && describeStyle(slot))}
        </div>
      </psk-chapter>,
    );
  }

  render() {
    if (!this.docs) {
      return;
    }

    this.appendTagAndEncapsulation();
    this.appendSummary();
    this.appendSlot();
    this.appendProps();
    this.appendEvents();
    this.appendMethods();
    this.appendSlots();
    this.appendCSSVariables();

    return <Host class="webc-docs">{this.content}</Host>;
  }
}
