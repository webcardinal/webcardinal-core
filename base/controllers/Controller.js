import DSUStorage from "../libs/DSUStorage";
import PskBindableModel from "../libs/bindableModel.js";
import ModalRegistryService from "../services/ModalRegistryService.js";

class Controller {
  constructor(element) {
    this.DSUStorage = new DSUStorage();

    this.element = element;
    this.element.componentOnReady().then(this.onReady.bind(this));
  }

  setModel(model) {
    this.model = PskBindableModel.setModel(model);
  }

  async onReady() {}

  showModal(modalName, options) {
    options = options || {};
    ModalRegistryService.getModal(modalName)
      .then((modalContent) => {
        let modal = this.element.querySelector("wcc-modal[data-type=modal]");

        if (!modal) {
          modal = document.createElement("wcc-modal");
          modal.innerHTML = modalContent;
          this.element.append(modal);
          modal.setAttribute("data-type", "modal");

          const { title, autoClose } = options;
          modal.setAttribute("modal-title", title);
          modal.setAttribute("auto-close", autoClose);
        }

        modal.addEventListener("closed", () => {
          modal.remove();
        });
      })
      .catch((error) => {
        console.error(
          `Modal ${modalName} is not configured or it couldn't be loaded!`,
          error
        );
      });
  }

  hideModal() {
    const modal = this.element.querySelector("wcc-modal[data-type=modal]");
    if (modal) {
      modal.remove();
    }
  }
}

export default Controller;
