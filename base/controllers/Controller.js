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
    this.history.push(pageTag, state);
  }

  showModal(text, modalTitle) {
    if (!modalTitle) {
      modalTitle = "Info";
    }
    this.createWccModal({
      modalTitle,
      text,
    });
  }

  showErrorModalAndRedirect(errorText, page, timeout) {
    if (!timeout) {
      timeout = 5000;
    }
    this.hideModal();

    this.createWccModal({
      modalTitle: "Error",
      text: errorText,
      canClose: false,
      showFooter: false,
    });

    setTimeout(() => {
      this.hideModal();
      console.log(`Redirecting to ${page}...`);
      this.navigateToPageTag(page);
    }, timeout);
  }

  createWccModal({ modalTitle, text, canClose, showFooter }) {
    const modal = this.createAndAddElement("wcc-modal", {
      modalTitle,
      text,
      canClose,
      showFooter,
    });

    modal.addEventListener("confirmed", () => {
      modal.remove();
    });
    modal.addEventListener("closed", () => {
      modal.remove();
    });
  }

  hideModal() {
    this.element
      .querySelectorAll("wcc-modal")
      .forEach((modal) => modal.remove());
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
