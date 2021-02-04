import DSUStorage from "../libs/DSUStorage";
import PskBindableModel from "../libs/bindableModel.js";

const ControllerHelper = {
  checkEventListener: (eventName, listener, options) => {
    if (typeof eventName !== "string" || eventName.trim().length === 0) {
      throw Error(`
        Argument eventName is not valid. It must be a non-empty string.
        Provided value: ${eventName}
      `);
    }

    if (typeof listener !== "function") {
      throw Error(`
        Argument listener is not valid, it must be a function.
        Provided value: ${listener}
      `);
    }

    if (
      options &&
      typeof options !== "boolean" &&
      typeof options !== "object"
    ) {
      throw Error(`
        Argument options is not valid, it must a boolean (true/false) in case of capture, or an options object.
        If no options are needed, this argument can be left empty.
        Provided value: ${options}
      `);
    }
  },
};

class Controller {
  constructor(element, history) {
    this.DSUStorage = new DSUStorage();

    this.element = element;
    this.history = history;
    this.element.componentOnReady().then(this.onReady.bind(this));

    this.tagEventListeners = {};

    this.setLegacyGetModelEventListener();
  }

  createElement(elementName, props) {
    return Object.assign(document.createElement(elementName), props);
  }

  createAndAddElement(elementName, props) {
    const element = this.createElement(elementName, props);
    this.element.appendChild(element);
    return element;
  }

  on(eventName, listener, options) {
    try {
      ControllerHelper.checkEventListener(eventName, listener, options);
      this.element.addEventListener(eventName, listener, options);
    } catch (err) {
      console.error(err);
    }
  }

  onTag(tag, eventName, listener, options) {
    try {
      ControllerHelper.checkEventListener(eventName, listener, options);

      if (!this.tagEventListeners[eventName]) {
        this.tagEventListeners[eventName] = [];
        this.element.addEventListener(
          eventName,
          this.getEventListener(eventName)
        );
      }
      const tagEventListener = this.tagEventListeners[eventName];
      tagEventListener.push({ tag, listener, options });
    } catch (err) {
      console.error(err);
    }
  }

  offTag(tag, eventName, listener, options) {
    try {
      ControllerHelper.checkEventListener(eventName, listener, options);

      if (this.tagEventListeners[eventName]) {
        const tagEventListener = this.tagEventListeners[eventName];
        const entryIndexesToRemove = tagEventListener
          .map((x, index) =>
            x.tag === tag && x.listener === listener ? index : -1
          )
          .filter((index) => index !== -1);
        entryIndexesToRemove.reverse();
        entryIndexesToRemove.forEach((index) => {
          tagEventListener.splice(index, 1);
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  onTagClick(tag, listener, options) {
    this.onTag(tag, "click", listener, options);
  }

  offTagClick(tag, listener, options) {
    this.offTag(tag, "click", listener, options);
  }

  off(eventName, listener, options) {
    try {
      ControllerHelper.checkEventListener(eventName, listener, options);
      this.element.removeEventListener(eventName, listener, options);
    } catch (error) {
      console.error(error);
    }
  }

  send(eventName, detail, options = {}) {
    let eventOptions = {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail,
      ...options,
    };

    this.element.dispatchEvent(new CustomEvent(eventName, eventOptions));
  }

  async onReady() {
    // TODO: a queue with all requests for listeners added with on method
    //       than the onReady mechanism will be removed for the end user
  }

  navigateToUrl(url, state) {
    this.history.push(url, state);
  }

  navigateToTag(tag, state) {
    this.element.dispatchEvent(
      new CustomEvent("webcardinal:tags:get", {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail: {
          tag,
          callback: (error, path) => {
            if (error) {
              console.error(error);
              return;
            }
            this.history.push(path, state);
          },
        },
      })
    );
  }

  setModel(model) {
    this.model = PskBindableModel.setModel(model);
  }

  getEventListener(eventName) {
    const tagEventListenerEntries = this.tagEventListeners[eventName];
    return (event) => {
      let target = event.target;
      while (target && target !== this.element) {
        const targetTag = target.getAttribute("data-tag");
        if (targetTag) {
          const targetTagListeners = tagEventListenerEntries.filter(
            (x) => x.tag === targetTag
          );
          if (targetTagListeners.length) {
            event.preventDefault(); // Cancel the native event
            event.stopPropagation(); // Don't bubble/capture the event any further

            console.log(
              `Found listener for event ${eventName} for tag: ${targetTag}`
            );
            const dataModelChain = target.getAttribute("data-model");
            const attachedModel = dataModelChain
              ? this.model.toObject(dataModelChain.slice(1))
              : undefined;

            targetTagListeners.forEach((x) => {
              x.listener(attachedModel, event);
            });
          }
        }

        target = target.parentElement;
      }
    };
  }

  setLegacyGetModelEventListener() {
    let dispatchModel = function (bindValue, model, callback) {
      if (bindValue && model[bindValue]) {
        callback(null, model[bindValue]);
      }

      if (!bindValue) {
        callback(null, model);
      }
    };

    this.element.addEventListener("getModelEvent", (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();

      let { bindValue, callback } = e.detail;

      if (typeof callback === "function") {
        return dispatchModel(bindValue, this.model, callback);
      }

      callback(new Error("No callback provided"));
    });
  }
}

export default Controller;
