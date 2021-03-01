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
      <section class="tag">
        <h1>
          <code>{tag}</code>
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
      <section class="description">
        <h2>Description</h2>
        <p innerHTML={docs} />
      </section>,
    );
  }

  appendProps() {
    const { props } = this.docs;
    if (!props || props.length === 0) {
      return;
    }

    const describeProp = ({ name, docs, attr, type, required, ...rest }) => {
      return [
        <thead>
          <tr>
            <th colSpan={2}>{name}</th>
          </tr>
        </thead>,
        <tbody>
          <tr>
            <th>Description</th>
            <td>{docs}</td>
          </tr>
          <tr>
            <th>Attribute</th>
            <td>
              <code>{attr}</code>
            </td>
          </tr>
          <tr>
            <th>Type</th>
            <td>
              <code>{type}</code>
            </td>
          </tr>
          <tr>
            <th>Required</th>
            <td>
              <code>{`${required}`}</code>
            </td>
          </tr>
          {rest.default ? (
            <tr>
              <th>Default</th>
              <td>
                <code>{`${rest.default}`}</code>
              </td>
            </tr>
          ) : null}
        </tbody>,
      ];
    };

    this.content.push(
      <section class="properties">
        <h2>Properties</h2>
        <table>{props.map(prop => describeProp(prop))}</table>
      </section>,
    );
  }

  appendEvents() {
    const { events } = this.docs;
    if (!events || events.length === 0) {
      return;
    }

    const describeEvent = ({ event, docs }) => {
      return [
        <thead>
          <tr>
            <th colSpan={2}>{event}</th>
          </tr>
        </thead>,
        <tbody>
          <tr>
            <th>Description</th>
            <td>{docs}</td>
          </tr>
        </tbody>,
      ];
    };

    this.content.push(
      <section class="events">
        <h2>Events</h2>
        <table>{events.map(event => describeEvent(event))}</table>
      </section>,
    );
  }

  appendMethods() {
    const { methods } = this.docs;
    if (!methods || methods.length === 0) {
      return;
    }

    const describeMethod = ({ name, docs, signature }) => {
      return [
        <thead>
          <tr>
            <th colSpan={2}>{name}</th>
          </tr>
        </thead>,
        <tbody>
          <tr>
            <th>Description</th>
            <td>{docs}</td>
          </tr>
          <tr>
            <th>Signature</th>
            <td>
              <code>{signature}</code>
            </td>
          </tr>
        </tbody>,
      ];
    };

    this.content.push(
      <section class="methods">
        <h2>Methods</h2>
        <table>{methods.map(method => describeMethod(method))}</table>
      </section>,
    );
  }

  appendSlots() {
    const { slots } = this.docs;
    if (!slots || slots.length === 0) {
      return;
    }

    const describeSlots = ({ name, docs }) => {
      return [
        <tbody>
          <tr>
            <th>
              <code>{name}</code>
            </th>
            <td innerHTML={docs} />
          </tr>
        </tbody>,
      ];
    };

    this.content.push(
      <section class="slots">
        <h2>Slots</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
            </tr>
          </thead>
          {slots.map(slot => describeSlots(slot))}
        </table>
      </section>,
    );
  }

  appendCSSVariables() {
    const { styles } = this.docs;
    if (!styles || styles.length === 0) {
      return;
    }

    const describeStyle = ({ name, docs }) => {
      return [
        <tbody>
          <tr>
            <th>
              <code style={{ whiteSpace: 'nowrap' }}>{name}</code>
            </th>
            <td innerHTML={docs} />
          </tr>
        </tbody>,
      ];
    };

    this.content.push(
      <section class="styles">
        <h2>CSS Variables</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
            </tr>
          </thead>
          {styles.map(slot => slot.annotation === 'prop' && describeStyle(slot))}
        </table>
      </section>,
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
