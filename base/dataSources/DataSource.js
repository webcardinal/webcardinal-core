import { getTranslationModel, translate } from '../controllers/Controller';
import PskBindableModel from '../libs/bindableModel.js';

export default class DataSource {
  /**
   * @param {object} [options]
   * @param {number | undefined} [options.recordsNumber]
   * @param {number} [options.pageSize=20]
   * @param {number} [options.pageSizeDelta=2]
   * @param {boolean} [options.useOptimisticMode=false]
   * @param {boolean} [options.useInfiniteScroll=false]
   * @param {string} [options.infiniteScrollPosition='bottom']
   */
  constructor(options) {
    if (!options) {
      options = {};
    }
    if (typeof options.recordsNumber !== 'number') {
      options.recordsNumber = undefined;
    }
    if (typeof options.pageSize !== 'number') {
      options.pageSize = 20;
    }
    if (typeof options.pageSizeDelta !== 'number') {
      options.pageSizeDelta = 2;
    }
    if (typeof options.useOptimisticMode !== 'boolean') {
      options.useOptimisticMode = false;
    }
    if (typeof options.useInfiniteScroll !== 'boolean') {
      options.useInfiniteScroll = false;
    }
    if (options.infiniteScrollPosition === undefined) {
      options.infiniteScrollPosition = 'bottom';
    }
    this.options = options;
    this.translationModel = PskBindableModel.setModel(getTranslationModel() || {});
    this.model = PskBindableModel.setModel({ data: [] });
  }

  // Public methods

  /**
   * @param {number} recordsNumber - count of your entire database, required for pagination
   */
  setRecordsNumber(recordsNumber) {
    if (typeof this.getElement !== 'function') {
      this.options.recordsNumber = recordsNumber;
      return;
    }

    const dataTableElement = this.getElement();
    dataTableElement.dataSize = recordsNumber;
  }

  getRecordsNumber() {
    if (typeof this.getElement !== 'function') {
      return this.options.recordsNumber;
    }

    const dataTableElement = this.getElement();
    return dataTableElement.dataSize;
  }

  /**
   * @param {number} pageSize - how many rows are displayed on a page
   */
  setPageSize(pageSize) {
    if (typeof this.getElement !== 'function') {
      this.options.pageSize = pageSize;
      return;
    }

    const dataTableElement = this.getElement();
    dataTableElement.pageSize = pageSize;
  }

  getPageSize() {
    if (typeof this.getElement !== 'function') {
      return this.options.pageSize;
    }

    const dataTableElement = this.getElement();
    return dataTableElement.pageSize;
  }

  /**
   * @returns {number} pageIndex - current index of pages which is displayed
   */
  getCurrentPageIndex() {
    const dataTableElement = this.getElement();
    return dataTableElement.curentPageIndex;
  }

  /**
   * @returns {number} pageIndex - last index from pagination
   */
  getLastPageIndex() {
    const dataTableElement = this.getElement();
    return dataTableElement.lastPageIndex;
  }

  /**
   * @param startOffset
   * @param dataLengthForCurrentPage
   *
   * @return Array - Items displayed for current page
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getPageDataAsync(startOffset, dataLengthForCurrentPage) {
    return [];
  }

  async clearPageDataAsync() {
    const dataTableElement = this.getElement();
    await dataTableElement.fillCurrentPage([]);
  }

  async forceLoading() {
    const dataTableElement = this.getElement();
    await dataTableElement.fillCurrentPage(undefined);
  }

  async forceUpdate(useLoading = true) {
    const pageIndex = this.getCurrentPageIndex();
    await this._renderPageAsync(pageIndex, useLoading);
  }

  // Optional await
  // When some action is required only after the page was changed

  async goToNextPage() {
    await this.goToPageByIndex(this.getCurrentPageIndex() + 1);
  }

  async goToPreviousPage() {
    await this.goToPageByIndex(this.getCurrentPageIndex() - 1);
  }

  async goToPageByIndex(pageIndex = 0) {
    if (pageIndex >= 0) {
      await this._renderPageAsync(pageIndex);
    }
  }

  translate(translationChain) {
    return translate(translationChain, this.translationModel)
  }

  // Private methods
  // Those are used for coupling between DataSource and webc-datatable

  _init = getElement => {
    this.getElement = getElement;

    const element = this.getElement();
    element.useOptimisticMode = this.options.useOptimisticMode;
    element.useInfiniteScroll = this.options.useInfiniteScroll;
    element.infiniteScrollPosition=this.options.infiniteScrollPosition;
    element.pageSizeDelta = this.options.pageSizeDelta;

    this.setPageSize(this.options.pageSize);
    this.setRecordsNumber(this.options.recordsNumber);

    return this.model;
  };

  _renderPageAsync = async (pageIndex = 0, useLoading = true) => {
    const dataTableElement = this.getElement();
    const { pageSize, dataSize } = dataTableElement;

    const startOffset = pageSize * pageIndex;
    const recordsOffset = dataSize ? Math.min(dataSize - startOffset, pageSize) : pageSize;

    if (!dataTableElement.useInfiniteScroll && useLoading) {
      await dataTableElement.clearCurrentPage();
      await dataTableElement.fillCurrentPage(undefined);
    }

    const pageData = await this.getPageDataAsync(startOffset, recordsOffset);
    dataTableElement.curentPageIndex = pageIndex;
    await dataTableElement.fillCurrentPage(pageData);
  };
}
