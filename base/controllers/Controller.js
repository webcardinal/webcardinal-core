import DSUStorage from "../libs/DSUStorage";
import PskBindableModel from "../libs/bindableModel.js";

class Controller {
  constructor(element, history) {
    this.DSUStorage = new DSUStorage();

    this.element = element;
    this.history = history;
    this.element.componentOnReady().then(this.onReady.bind(this));
  }

  setModel(model) {
    this.model = PskBindableModel.setModel(model);
  }

  async onReady() {}

  navigateToPageUrl(pageUrl, state) {
    this.history.push(pageUrl, state);
  }

  navigateToPageTag(pageTag, state) {
    // TODO: get URL from page tag
    const pageUrl = pageTag;
    this.history.push(pageUrl, state);
  }

  createElement(elementName, props) {
    const element = Object.assign(document.createElement(elementName), props);
    return element;
  }

  createAndAddElement(elementName, props) {
    const element = this.createElement(elementName, props);
    this.element.appendChild(element);
    return element;
  }
}

export default Controller;
