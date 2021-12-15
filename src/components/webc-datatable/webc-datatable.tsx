import type { EventEmitter } from '@stencil/core';
import { Component, Host, h, Prop, Event, Method, Watch } from '@stencil/core';

import {
  FOR_ATTRIBUTE,
  FOR_OPTIONS,
  FOR_EVENTS,
  FOR_CONTENT_REPLACED_EVENT,
  FOR_CONTENT_UPDATED_EVENT,
  FOR_OPTIMISTIC,
  FOR_TEMPLATE_SIZE,
  MODEL_CHAIN_PREFIX,
} from '../../constants';
import { HostElement } from '../../decorators';
import { BindingService, ComponentListenersService } from '../../services';
import { isElementNode, isTextNode } from '../../services/BindingService/binding-service-utils';
import { promisifyEventEmit } from '../../utils';

import { getPagination } from './webc-datatable.utils';

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

  @Prop() pageSize = 0;

  @Prop() pageSizeDelta = 2;

  @Prop() curentPageIndex = 0;

  @Prop({ mutable: true }) lastPageIndex = 0;

  @Prop({ reflect: true }) hidePagination = false;

  @Prop({ reflect: true }) useInfiniteScroll = false;

  @Prop({ reflect: true }) useOptimisticMode = false;

  @Prop({ reflect: true, mutable: true }) loading = false;

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
  private infinitScroll;
  private model;
  private childrenCount = 0;
  private bootConfig = {
    hidePagination: false,
  };

  private getTemplatesFromDOM = () => {
    const templates = {
      header: [],
      data: [],
      loading: [],
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

  private createDataTableWithPagination = () => {
    const { header, data, loading } = this.getTemplatesFromDOM();

    const dataTable = document.createElement('div') as any;
    dataTable.setAttribute('slot', 'data');
    dataTable.classList.add('webc-datatable--container');
    dataTable.setAttribute(FOR_TEMPLATE_SIZE, `${this.childrenCount}`);
    dataTable.setAttribute(FOR_ATTRIBUTE, `${MODEL_CHAIN_PREFIX}${DATA_INTERNAL_CHAIN}`);
    dataTable.setAttribute(FOR_OPTIONS, `${FOR_EVENTS}${this.useOptimisticMode ? ` ${FOR_OPTIMISTIC}` : ''}`);
    dataTable.addEventListener(FOR_CONTENT_REPLACED_EVENT, event => {
      event.stopPropagation();
      dataTable.prepend(...header);
    });
    dataTable.addEventListener(FOR_CONTENT_UPDATED_EVENT, event => {
      event.stopPropagation();
    });

    if (this.useInfiniteScroll) {
      for (const element of loading) {
        element.remove();
      }
    } else {
      if (loading.length === 0) {
        const webcSpinner = this.createDefaultSpinner();
        webcSpinner.style.position = 'relative';
        webcSpinner.style.margin = '0 auto';
        loading.push(webcSpinner);
      }

      for (const element of loading) {
        element.setAttribute('slot', 'loading');
        dataTable.append(element)
      }
    }

    dataTable.append(...data);

    const afterBindingCallback = () => {
      dataTable.prepend(...header);
    };

    return {
      dataTable,
      afterBindingCallback,
      loading,
    };
  };

  private createDataTableWithInfiniteScroll = () => {
    if (!customElements.get('ion-infinite-scroll') || !customElements.get('ion-infinite-scroll-content')) {
      console.error(
        [
          `For Infinit Scroll webc-datatable uses Ionic (v5)!`,
          `Please add Ionic distribution to your application!`,
        ].join('\n'),
      );
      console.warn('Fallback to pagination mode for webc-datatable!');
      return this.createDataTableWithPagination();
    }

    const {
      dataTable: internDataTable,
      afterBindingCallback: internAfterBindingCallback,
      loading: loadingSlots,
    } = this.createDataTableWithPagination();

    internDataTable.removeAttribute('slot');

    const ionContent = document.createElement('ion-content') as any;
    ionContent.style.setProperty('--background', 'transparent');
    ionContent.scrollY = false;
    ionContent.append(internDataTable);

    const dataTable = document.createElement('div');
    dataTable.classList.add('webc-datatable--scroll');
    dataTable.setAttribute('slot', 'data');
    dataTable.append(ionContent);

    // after first render of data-for, the height of ion-content (parent of .webc-datatable--container) must be set
    // this is made automatically base on first bucket/page of items that are rendered
    // watch property "height" in styles of ion-content, the main conclusion is that
    // the height of webc-datasource in infinite scroll mode is equal with the height of first bucket of items
    // if a static height is desired, set '--height' custom property for webc-datatable (or for ion-content)
    const internDataTableCallback = event => {
      event.stopPropagation();
      internDataTable.removeEventListener(FOR_CONTENT_REPLACED_EVENT, internDataTableCallback);
      internDataTable.removeEventListener(FOR_CONTENT_UPDATED_EVENT, internDataTableCallback);
      ionContent.scrollY = true;
      window.requestAnimationFrame(() => {
        ionContent.style.height = `var(--height, ${internDataTable.scrollHeight}px)`;
      });
    };

    // after BindingService does his job, other nodes must be injected into the webc-datatable
    // for example ion-infinite-scroll and infinite-infinit-scroll-content
    const afterBindingCallback = () => {
      internAfterBindingCallback();

      const ionInfiniteContent = document.createElement('ion-infinite-scroll-content') as any;
      ionInfiniteContent.loadingSpinner = null;

      if (loadingSlots.length > 0) {
        const div = document.createElement('div');
        div.append(...loadingSlots);
        ionInfiniteContent.componentOnReady().then(() => {
          ionInfiniteContent.firstElementChild.append(div);
        });
      } else {
        const webcSpinner = this.createDefaultSpinner();
        ionInfiniteContent.loadingText = webcSpinner.outerHTML;
      }
      this.infinitScroll = document.createElement('ion-infinite-scroll');
      this.infinitScroll.classList.add('infinite-scroll-enabled', 'infinite-scroll-loading');

      let currentPageIndex = 0;
      this.infinitScroll.addEventListener('ionInfinite', async event => {
        event.stopPropagation();
        event.stopImmediatePropagation();
        currentPageIndex++;
        await this.dataSource._renderPageAsync(currentPageIndex);
        window.requestAnimationFrame(() => this.infinitScroll.complete());
      });
      this.infinitScroll.append(ionInfiniteContent);
      this.infinitScroll.componentOnReady().then(() => {
        ionContent.style.height = `var(--height, ${internDataTable.scrollHeight + this.infinitScroll.scrollHeight}px)`;
      });
      ionContent.append(this.infinitScroll);
    };

    internDataTable.addEventListener(FOR_CONTENT_REPLACED_EVENT, internDataTableCallback);
    internDataTable.addEventListener(FOR_CONTENT_UPDATED_EVENT, internDataTableCallback);

    return { dataTable, afterBindingCallback };
  };

  private createDefaultSpinner = () => {
    const webcSpinner = document.createElement('webc-spinner');
    webcSpinner.classList.add('webc-datatable--loading');
    return webcSpinner;
  };

  private createDefaultPagination = (): HTMLElement[] => {
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

    if (this.hidePagination || this.useInfiniteScroll) {
      return null;
    }

    return (
      <div part="pagination" class="pagination">
        {this.createDefaultPagination()}
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

    this.host.classList.add('webc-datatable');

    const { dataTable, afterBindingCallback } = this.useInfiniteScroll
      ? this.createDataTableWithInfiniteScroll()
      : this.createDataTableWithPagination();
    this.host.append(dataTable);

    BindingService.bindChildNodes(this.host, {
      model: this.model,
      translationModel,
      recursive: true,
      enableTranslations: true,
    });

    afterBindingCallback();

    this.listeners = new ComponentListenersService(this.host, {
      model: this.model,
      translationModel,
      chain: `${MODEL_CHAIN_PREFIX}${DATA_INTERNAL_CHAIN}`,
    });
    this.listeners.getModel.add();
    this.listeners.getTranslationModel.add();
    this.listeners.getParentChain.add();
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
      const elementSlot = createSlot(slot);
      beforeSlot.insertAdjacentElement('afterend', elementSlot);
      return elementSlot;
    };

    let dataSlot = getSlot('data');

    const renderNoDataSlotIfNotExist = () => {
      dataSlot?.remove();
      dataSlot = undefined;
      if (!getSlot('no-data')) {
        injectSlot('no-data');
      }
      this.hidePagination = true;
      this.model.data = [];
    };
    const renderDataSlotIfNotExist = () => {
      if (!dataSlot) {
        getSlot('no-data')?.remove();
        dataSlot = injectSlot('data');
      }
    };
    const isDataEmpty = (newData = data) => Array.isArray(newData) && newData.length === 0;
    const isLoading = () => typeof data === 'undefined';

    // infinite scroll
    if (this.useInfiniteScroll) {
      if (isDataEmpty() && isDataEmpty(this.model.data)) {
        renderNoDataSlotIfNotExist();
        return;
      }

      if (isDataEmpty()) {
        this.infinitScroll.disabled = true;
        return;
      }

      if (isLoading()) {
        this.model.data = undefined;
        return;
      }

      this.infinitScroll.disabled = false;

      renderDataSlotIfNotExist();

      if (!Array.isArray(this.model.data)) {
        this.model.data = [];
      }

      this.model.data.push(...data);

      // if there will be no data to fetch in the future disable infinite scrolling
      // more precise, all the date from the datasource is now shown in datatable
      if (typeof this.dataSize === 'number' && this.dataSize === this.model.data.length) {
        this.infinitScroll.disabled = true;
        return;
      }

      return;
    }

    // pagination
    if (isDataEmpty()) {
      renderNoDataSlotIfNotExist();
      return;
    }

    if (isLoading()) {
      this.model.data = undefined;
      return;
    }

    renderDataSlotIfNotExist();

    if (!Array.isArray(this.model.data)) {
      this.model.data = [];
    }

    if (!this.bootConfig.hidePagination) {
      this.hidePagination = false;
    }

    this.model.data = data;
  }

  @Method()
  async clearCurrentPage() {
    if (!this.model) {
      return;
    }

    this.model.data.length = 0;
  }

  @Watch('pageSize')
  async pageSizeHandler() {
    this.dataSource._renderPageAsync();
  }

  render() {
    return this.dataSource ? (
      <Host>
        <slot name="before" />
        <slot name="data" />
        {this.managePagination()}
        <slot name="loading" />
        <slot name="footer" />
        <slot name="after" />
      </Host>
    ) : null;
  }
}
