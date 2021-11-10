import type { EventEmitter } from '@stencil/core';
import { Component, Host, h, Prop, Event, Method, Watch } from '@stencil/core';

import {
  FOR_ATTRIBUTE,
  FOR_OPTIONS,
  FOR_EVENTS,
  FOR_CONTENT_REPLACED_EVENT,
  FOR_CONTENT_UPDATED_EVENT,
  FOR_TEMPLATE_SIZE,
  MODEL_CHAIN_PREFIX,
} from '../../constants';
import { HostElement } from '../../decorators';
import { BindingService, ComponentListenersService } from '../../services';
import { isElementNode, isTextNode } from '../../services/BindingService/binding-service-utils';
import { promisifyEventEmit } from '../../utils';

import { getPagination } from './webc-datatable.utils';

const DATA_SORTABLE_STYLES = `
[data-sortable] {
    --header-arrow-size: 0.25rem;
    --header-arrow-color: #BBBBBB;

    cursor: pointer;
    position: relative;
    padding-right: calc(5 * var(--header-arrow-size));
}

[data-sortable]::before,
[data-sortable]::after {
    content: "";
    height: 0;
    width: 0;
    position: absolute;
    right: 4px;
    border-left: var(--header-arrow-size) solid transparent;
    border-right: var(--header-arrow-size) solid transparent;
    opacity: 1;
}

[data-sortable]::before {
    border-bottom: var(--header-arrow-size) solid var(--header-arrow-color);
    border-top: var(--header-arrow-size) solid transparent;
    bottom: 55%;
}

[data-sortable]::after {
    border-top: var(--header-arrow-size) solid var(--header-arrow-color);
    top: 55%;
}
`;
const DATA_INTERNAL_CHAIN = `data`;

/**
 * @slot -
 * @slot before -
 * @slot header -
 * @slot footer -
 * @slot after -
 */
@Component({
  tag: 'webc-datatable',
  styleUrls: {
    default: '../../styles/webc-datatable/webc-datatable.scss',
  },
  shadow: true,
})
export class WebcDatatable {
  @HostElement() host: HTMLElement;

  @Prop({ attribute: 'datasource' }) chain: string;

  @Prop() dataSize: number | undefined;

  @Prop() pageSize = 20;

  @Prop() pageSizeDelta = 2;

  @Prop() curentPageIndex = 0;

  @Prop({ mutable: true }) lastPageIndex = 0;

  @Prop({ reflect: true }) hidePagination = false;

  @Prop({ mutable: true }) templateChildrenCount = 0;

  /**
   * Through this event the model is received.
   */
  @Event({
    eventName: 'webcardinal:model:get',
    bubbles: true,
    composed: true,
    cancelable: true,
  })
  getModelEvent: EventEmitter;

  /**
   * Through this event the translation model is received.
   */
  @Event({
    eventName: 'webcardinal:translationModel:get',
    bubbles: true,
    composed: true,
    cancelable: true,
  })
  getTranslationModelEvent: EventEmitter;

  private listeners: ComponentListenersService;
  private dataSource;
  private model;
  private childrenCount = 0;
  private bootConfig = {
    hidePagination: false,
  };

  private getTemplatesFromDOM = () => {
    const templates = {
      header: [],
      data: [],
    };
    const slots = Object.keys(templates);
    for (const childNode of Array.from(this.host.childNodes)) {
      if (isTextNode(childNode)) {
        templates['data'].push(childNode);
        continue;
      }
      if (isElementNode(childNode)) {
        const child = childNode as HTMLElement;
        if (!child.hasAttribute('slot')) {
          templates['data'].push(child);
          this.childrenCount++;
          continue;
        }

        if (slots.includes(child.slot)) {
          const { slot } = child;
          child.removeAttribute('slot');
          child.classList.add(`webc-datatable--${slot}`);
          templates[slot].push(child);
          this.childrenCount++;
        }
      }
    }
    return templates;
  };

  private getDataSourceFromModel = async () => {
    let { chain } = this;

    if (chain.startsWith(MODEL_CHAIN_PREFIX)) {
      chain = chain.substring(1);
    }

    const model = await promisifyEventEmit(this.getModelEvent);
    return model.getChainValue(chain);
  };

  // private storeDataSourceToWindow = () => {
  //   const { page } = window.WebCardinal.state;
  //   if (!page.dataSources) {
  //     page.dataSources = {};
  //   }
  //   if (!page.dataSources[this.datasource]) {
  //     page.dataSources[this.datasource] = this.dataSource;
  //   }
  // };

  private renderPagination = () => {
    const pageIndex = this.curentPageIndex + 1;
    const numberOfPages = this.lastPageIndex;

    const result = [];
    const pagination = getPagination(pageIndex, numberOfPages, this.pageSizeDelta);

    for (const i of pagination) {
      if (typeof i === 'number') {
        if (i === pageIndex) {
          result.push(
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            <button active part="pagination-button pagination-button--active" disabled>
              {i}
            </button>,
          );
          continue;
        }

        result.push(
          <button part="pagination-button" onClick={() => this.dataSource.goToPageByIndex(i - 1)}>
            {i}
          </button>,
        );
        continue;
      }
      if (typeof i === 'string') {
        result.push(i);
      }
    }

    if (numberOfPages !== 1) {
      result.unshift(
        <button
          part="pagination-button pagination-button--previous"
          disabled={pageIndex === 1}
          onClick={() => this.dataSource.goToPreviousPage()}
        >
          {'‹'}
        </button>,
      );

      result.push(
        <button
          part="pagination-button pagination-button--next"
          disabled={pageIndex === numberOfPages}
          onClick={() => this.dataSource.goToNextPage()}
        >
          {'›'}
        </button>,
      );
    }

    return result;
  };

  private managePagination = () => {
    this.model.pageNumbers = {
      current: this.curentPageIndex + 1,
      start: 1,
      end: this.lastPageIndex,
    };

    if (this.hidePagination) {
      return null;
    }

    return (
      <div part='pagination' class='pagination'>
        {this.renderPagination()}
      </div>
    );
  };

  async componentWillLoad() {
    if (!this.host.isConnected) {
      return;
    }

    this.bootConfig.hidePagination = this.hidePagination;

    this.dataSource = await this.getDataSourceFromModel();
    const translationModel = await promisifyEventEmit(this.getTranslationModelEvent);

    const { DataSource } = window.WebCardinal.dataSources;
    if (!this.dataSource || typeof this.dataSource !== 'object' || !(this.dataSource instanceof DataSource)) {
      console.error(`An invalid WebCardinal DataSource instance received: "${this.chain}"! [1]`, this.dataSource);
      return;
    }

    try {
      this.model = await this.dataSource._init(() => this.host);
    } catch (error) {
      console.error(`An invalid WebCardinal DataSource instance received: "${this.chain}"! [2]`, this.dataSource);
      this.dataSource = undefined;
      return;
    }

    const { header, data } = this.getTemplatesFromDOM();

    this.host.classList.add('webc-datatable');

    const dataSortableStyles = document.createElement('style');
    dataSortableStyles.innerHTML = DATA_SORTABLE_STYLES;

    const dataTable = document.createElement('div');
    dataTable.setAttribute('slot', 'data');
    dataTable.classList.add('webc-datatable--container');
    dataTable.setAttribute(FOR_TEMPLATE_SIZE, `${this.childrenCount}`);
    dataTable.setAttribute(FOR_ATTRIBUTE, `${MODEL_CHAIN_PREFIX}${DATA_INTERNAL_CHAIN}`);
    dataTable.setAttribute(FOR_OPTIONS, `${FOR_EVENTS}`);
    dataTable.append(...data);
    dataTable.addEventListener(FOR_CONTENT_REPLACED_EVENT, event => {
      event.stopImmediatePropagation();
      dataTable.prepend(...header);
    });
    dataTable.addEventListener(FOR_CONTENT_UPDATED_EVENT, event => {
      event.stopImmediatePropagation();
    });

    this.host.append(dataSortableStyles, dataTable);

    BindingService.bindChildNodes(this.host, {
      model: this.model,
      translationModel,
      recursive: true,
      enableTranslations: true,
    });

    this.listeners = new ComponentListenersService(this.host, {
      model: this.model,
      translationModel,
      chain: `${MODEL_CHAIN_PREFIX}${DATA_INTERNAL_CHAIN}`,
    });
    this.listeners.getModel.add();
    this.listeners.getTranslationModel.add();
    this.listeners.getParentChain.add();

    dataTable.prepend(...header);

    this.dataSource._renderPageAsync();
  }

  async componentWillRender() {
    this.lastPageIndex = this.dataSize ? Math.ceil(this.dataSize / this.pageSize) : 1;
  }

  async connectedCallback() {
    if (this.listeners) {
      const { getModel, getTranslationModel, getParentChain } = this.listeners;
      getModel?.add();
      getTranslationModel?.add();
      getParentChain?.add();
    }
  }

  async disconnectedCallback() {
    if (this.listeners) {
      const { getModel, getTranslationModel, getParentChain } = this.listeners;
      getModel?.remove();
      getTranslationModel?.remove();
      getParentChain?.remove();
    }
  }

  @Method()
  async fillCurrentPage(data) {
    const getSlot = slot => this.host.shadowRoot.querySelector(`slot[name="${slot}"]`) as HTMLSlotElement | undefined;
    const createSlot = slot => Object.assign(document.createElement('slot'), { name: slot });
    const injectSlot = slot => {
      const beforeSlot = getSlot('before');
      beforeSlot.insertAdjacentElement('afterend', createSlot(slot));
    };

    const dataSlot = getSlot('data');

    if (!data || data.length === 0) {
      dataSlot?.remove();
      if (!getSlot('no-data')) {
        injectSlot('no-data');
      }
      this.hidePagination = true;
      this.model.data = [];
      return;
    }

    if (!dataSlot) {
      getSlot('no-data')?.remove();
      injectSlot('data');
    }

    if (!this.bootConfig.hidePagination) {
      this.hidePagination = false;
    }
    this.model.data = data;
  }

  @Method()
  async clearCurrentPage() {
    this.model.data.length = 0;
  }

  @Watch('pageSize')
  pageSizeHandler() {
    this.dataSource._renderPageAsync();
  }

  render() {
    return this.dataSource ? (
      <Host>
        <slot name="before" />
        <slot name="data" />
        {this.managePagination()}
        <slot name="footer" />
        <slot name="after" />
      </Host>
    ) : null;
  }
}
