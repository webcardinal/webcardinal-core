import DSUStorage from "../libs/DSUStorage";
import PskBindableModel from "../libs/bindableModel.js";

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
}

export default Controller;
