import { DISABLE_BINDING, VIEW_MODEL_KEY } from '../constants';

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

      customElements.define(
        tagName,
        class _ extends HTMLElement {
          private readonly _element: HTMLWebcComponentElement;
          private _shadow: ShadowRoot | null;
          private _model: any;
          private _translationModel: any;

          constructor() {
            super();

            // decides if this CustomElement should have #shadow-root (open)
            if (this.hasAttribute('shadow')) {
              this._shadow = this.attachShadow({ mode: 'open' });
            }

            // creates webc-component witch renders the template, create a constructor if needed and binds the models
            this._element = Object.assign(document.createElement('webc-component'), {
              template,
              element: this,
            });
          }

          connectedCallback() {
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
              this._element.remove();
              this.removeAttribute(DISABLE_BINDING);
            });

            // append webc-component in shadow or not
            if (this.hasAttribute('shadow')) {
              this._shadow.append(this._element);
            } else {
              this.append(this._element);
            }
          }

          async getModel() {
            return this._model;
          }

          async getTranslationModel() {
            return this._translationModel;
          }
        },
      );
    },
  };
}
