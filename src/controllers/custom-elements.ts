import { DISABLE_BINDING, VIEW_MODEL_KEY } from '../constants';
import { ComponentListenersService } from '../services';

let tagNames = new Set();

export function getCustomElementsTagNames() {
  return tagNames;
}

export default function getCustomElementsAPI() {
  return {
    /**
     * @param {string} tagName - the HTML tag of the desired CustomElement
     * @param {string} [template] - path to a HTML template (the root is /components directory)
     */
    define: (tagName: string, template?: string) => {
      if (!template) {
        template = `${tagName}/${tagName}`;
      }

      tagName = tagName.toLowerCase();

      customElements.define(
        tagName,
        class _ extends HTMLElement {
          private _element: HTMLWebcComponentElement | null;
          private _model: any;
          private _translationModel: any;
          private _listeners: ComponentListenersService;

          constructor() {
            super();

            // decides if this CustomElement should have #shadow-root (open)
            if (this.hasAttribute('shadow')) {
              this.attachShadow({ mode: 'open' });
            }
          }

          connectedCallback() {
            // prevents some effects from Stencil (double invocation of connectedCallback)
            let target = this.shadowRoot || this;
            if (target.children.length !== 0) {
              return;
            }

            // creates webc-component witch renders the template, create a constructor if needed and binds the models
            this._element = Object.assign(document.createElement('webc-component'), {
              template,
              element: this,
            });

            // disable data-view-model for attributes of this CustomElement
            this.setAttribute(DISABLE_BINDING, '');

            // copy all attributes of this CustomElement to webc-component
            Array.from(this.attributes).forEach(attr => {
              if (['shadow', 'className', DISABLE_BINDING, VIEW_MODEL_KEY].includes(attr.nodeName)) {
                return;
              }
              this._element.setAttribute(attr.nodeName, attr.nodeValue);
            });

            // when webc-component is ready pass the model and the translation model
            // then remove it from DOM, and clear some internal attributes for CustomElement
            this._element.componentOnReady().then(async () => {
              this._model = await this._element.getModel();
              this._translationModel = await this._element.getTranslationModel();
              this._listeners = await this._element.getListeners();
              this._listeners.getModel.add();
              this._listeners.getTranslationModel.add();
              this._element.remove();
              this.classList.add('hydrated');
              this.removeAttribute(DISABLE_BINDING);
            });

            // append webc-component in shadow or not
            if (this.shadowRoot) {
              if (!this.hasAttribute('shadow')) {
                this.setAttribute('shadow', '');
              }
              this.shadowRoot.append(this._element);
            } else {
              this.append(this._element);
            }
          }

          disconnectedCallback() {
            if (!this._listeners) {
              return;
            }

            this._listeners.getModel.remove();
            this._listeners.getTranslationModel.remove();
          }

          async getModel() {
            return this._model;
          }

          async getTranslationModel() {
            return this._translationModel;
          }

          set controller(controller) {
            this.setAttribute('controller', `${controller}`);
          }
        },
      );
      tagNames.add(tagName);
    },
  };
}
