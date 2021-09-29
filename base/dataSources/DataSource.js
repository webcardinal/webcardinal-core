import PskBindableModel from '../libs/bindableModel.js';

export default class DataSource {
  /**
   * @param {object} [options]
   * @param {number | undefined} [options.recordsNumber]
   * @param {number} [options.pageSize=20]
   * @param {number} [options.pageSizeDelta=2]
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

    this.options = options;
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
   * @param startOffset
   * @param dataLengthForCurrentPage
   *
   * @return Array - Items displayed for current page
   */
  async getPageDataAsync(startOffset, dataLengthForCurrentPage) {
    return [];
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
    await this._renderPageAsync(pageIndex);
  }

  // TODO

  changeFilter() {}

  // Private methods
  // Those are used for coupling between DataSource and webc-datatable

  _init = getElement => {
    this.getElement = getElement;

    const element = this.getElement();
    element.pageSizeDelta = this.options.pageSizeDelta;

    this.setPageSize(this.options.pageSize);
    this.setRecordsNumber(this.options.recordsNumber);
    return PskBindableModel.setModel({ data: [] });
  };

  _renderPageAsync = async (pageIndex = 0) => {
    const dataTableElement = this.getElement();
    const { pageSize, dataSize } = dataTableElement;

    const startOffset = pageSize * pageIndex;
    const recordsOffset = dataSize ? Math.min(dataSize - startOffset, pageSize) : pageSize;

    await dataTableElement.clearCurrentPage();
    dataTableElement.curentPageIndex = pageIndex;
    const pageData = await this.getPageDataAsync(startOffset, recordsOffset);
    await dataTableElement.fillCurrentPage(pageData);
  };
}
