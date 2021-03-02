import { Component, Host, h, Prop } from '@stencil/core';
import { HostElement } from '../../decorators';

@Component({
  tag: 'webc-docs',
  styleUrls: {
    default: '../../styles/webc-docs/webc-docs.scss',
  },
})
export class WebcContainer {
  @HostElement() private host: HTMLElement;

  @Prop() for: string;

  @Prop() local: boolean = false;

  private cheatsheet;
  private docs;
  private content = [];

  async componentWillLoad() {
    if (!this.host.isConnected) {
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

  appendDescription() {
    const { docs } = this.docs;
    if (!docs) {
      return;
    }

    this.content.push(
      <psk-description class="docs-section description" title="Description">
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
            <span>Description</span>
            <div innerHTML={docs} />
            <span>Attribute</span>
            <div>
              <code>
                <strong>{attr}</strong>
              </code>
            </div>
            <span>Type</span>
            <div>
              <code>{type}</code>
            </div>
            <span>Required</span>
            <div>
              <code>{`${required}`}</code>
            </div>
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
          <div class="table">
            <span>Description</span>
            <div innerHTML={docs} />
          </div>
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
            <span>Description</span>
            <div innerHTML={docs} />
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
    this.appendDescription();
    this.appendProps();
    this.appendEvents();
    this.appendMethods();
    this.appendSlots();
    this.appendCSSVariables();

    return <Host class="webc-docs">{this.content}</Host>;
  }
}
