import {
  CUSTOM_ELEMENTS_PATH,
  DISABLE_BINDING,
  EVENT_MODEL_GET,
  EVENT_PARENT_CHAIN_GET,
  EVENT_TRANSLATION_MODEL_GET,
  HYDRATED,
  MODEL_CHAIN_PREFIX,
  TRANSLATION_CHAIN_PREFIX,
  VIEW_MODEL_KEY,
} from '../constants';
import { BindingService, ComponentListenersService } from '../services';
import {
  extractChain,
  getSkinFromState,
  getSkinPathFromState,
  getTranslationsFromState,
  loadHTML,
  mergeChains,
  promisifyEventDispatch,
  URLHelper,
} from '../utils';

const tagNames = new Set();
const components = {};
const { join } = URLHelper;

async function getTemplate(templatePath) {
  const { basePath } = window.WebCardinal;
  const skin = getSkinFromState();

  if (!components[skin]) {
    components[skin] = {};
  }

  if (components[skin][templatePath]) {
    return components[skin][templatePath];
  }

  // check if there is a template for current skin
  let [error, template] = await loadHTML(
    join(basePath, getSkinPathFromState(), CUSTOM_ELEMENTS_PATH, templatePath).pathname,
  );

  if (!error) {
    components[skin][templatePath] = template;
    return template;
  }

  // only one request for default skin
  if (skin === 'default') {
    return '';
  }

  if (!components['default']) {
    components['default'] = {};
  }

  if (components['default'][templatePath]) {
    return components['default'][templatePath];
  }

  // if there is no template from skin, fallback is to default skin (root level)
  [error, template] = await loadHTML(join(basePath, CUSTOM_ELEMENTS_PATH, templatePath).pathname);

  if (!error) {
    components['default'][templatePath] = template;
    return template;
  }

  return '';
}

export function getCustomElementsTagNames() {
  return tagNames;
}

export default function getCustomElementsAPI() {
  return {
    /**
     * @param {string} tagName - the HTML tag of the desired CustomElement
     * @param args
     *
     * If
     *    typeof args[0] is string, args[0] is path to .html template of CustomElement,
     *    args[1] will be options
     * Otherwise
     *    args[0] will be options
     *
     * @usage
     * define('test-component')
     * define('test-component', options)
     * define('test-component', 'path/to/test-component', options)
     *
     * Options:
     * @param {boolean} args[?].options.shadow - CustomElement should have #shadow-root (open)
     */
    define: (tagName: string, ...args) => {
      tagName = tagName.toLowerCase();
      let template;
      let options = {
        templatePath: `${tagName}/${tagName}`,
        shadow: false,
      };

      if (typeof args[0] === 'string') {
        options.templatePath = args[0];
        args.shift();
      }
      if (typeof args[0] === 'object') {
        options = {
          ...options,
          ...(args[0] || {}),
        };
      }

      customElements.define(
        tagName,
        class WebcElement extends HTMLElement {
          private model;
          private translationModel;
          private parentChain;
          private listeners: ComponentListenersService;

          constructor() {
            super();

            if (options.shadow) {
              this.attachShadow({ mode: 'open' });
            } else if (this.hasAttribute('shadow')) {
              this.attachShadow({ mode: 'open' });
            }
          }

          replaceChains(plainHTML) {
            const replaceAttributes = plainHTML => {
              let documentHTML: Document;

              try {
                const parser = new DOMParser();
                documentHTML = parser.parseFromString(plainHTML, 'text/html');
              } catch (error) {
                console.error(error);
              }

              if (!documentHTML || !documentHTML.body) return;

              const replaceInElementWithActualChain = (element: Element) => {
                for (const attr of Array.from(element.attributes)) {
                  if (
                    attr.nodeValue.startsWith(MODEL_CHAIN_PREFIX) ||
                    attr.nodeValue.startsWith(TRANSLATION_CHAIN_PREFIX)
                  ) {
                    const key = attr.nodeValue.slice(1);
                    if (this.hasAttribute(key)) {
                      element.setAttribute(attr.nodeName, this.getAttribute(key));
                    }
                  }
                }

                for (const child of Array.from(element.children)) {
                  replaceInElementWithActualChain(child);
                }
              };

              replaceInElementWithActualChain(documentHTML.body);

              return [documentHTML.head.innerHTML, documentHTML.body.innerHTML].join('');
            };
            const replaceInnerSyntax = plainHTML => {
              Array.from(this.attributes).forEach(attr => {
                if (attr.nodeName === VIEW_MODEL_KEY) return;
                const innerSyntaxRegEx = new RegExp(
                  `{{\\s*[${MODEL_CHAIN_PREFIX}${TRANSLATION_CHAIN_PREFIX}](${attr.nodeName})\\s*}}`,
                  'gm',
                );
                if ([MODEL_CHAIN_PREFIX, TRANSLATION_CHAIN_PREFIX].includes(attr.nodeValue[0])) {
                  plainHTML = plainHTML.replace(innerSyntaxRegEx, `{{ ${attr.nodeValue} }}`);
                  return;
                }
                plainHTML = plainHTML.replace(innerSyntaxRegEx, attr.nodeValue);
              });
              return plainHTML;
            };

            return replaceInnerSyntax(replaceAttributes(plainHTML));
          }

          removeListeners() {
            if (!this.listeners) {
              return;
            }
            this.listeners.getModel.remove();
            this.listeners.getTranslationModel.remove();
            this.listeners.getParentChain.remove();
          }

          async connectedCallback() {
            this.setAttribute(DISABLE_BINDING, '');

            if (!template) {
              try {
                template = await getTemplate(options.templatePath);
              } catch (error) {
                console.error(
                  `Error while loading template for "${this.tagName.toLowerCase()}" from path "${
                    options.templatePath
                  }"`,
                  error,
                );
                return;
              }
            }

            try {
              this.model = await promisifyEventDispatch(EVENT_MODEL_GET, this);
              this.translationModel = await promisifyEventDispatch(EVENT_TRANSLATION_MODEL_GET, this);
              this.parentChain = await promisifyEventDispatch(EVENT_PARENT_CHAIN_GET, this);
            } catch (error) {
              console.error(`Error while getting models for BindingService`, error);
            }

            let html = this.replaceChains(template);
            const model = this.model;
            const translationModel = this.translationModel;
            const recursive = true;
            const chain = mergeChains(this.parentChain, extractChain(this));
            const chainWithoutPrefix = chain ? chain.slice(1) : null;
            const enableTranslations = getTranslationsFromState();

            if (this.hasAttribute('controller')) {
              html = `
                <webc-container
                  controller='${this.getAttribute('controller')}' disable-container>
                  ${html}
                </webc-container>
              `;
            }

            if (this.shadowRoot) {
              if (!this.hasAttribute('shadow')) {
                this.setAttribute('shadow', '');
              }

              this.shadowRoot.innerHTML = html;

              BindingService.bindChildNodes(this.shadowRoot, {
                model,
                translationModel,
                recursive,
                chainPrefix: chainWithoutPrefix,
                enableTranslations,
              });
            } else {
              this.innerHTML = html;
            }

            BindingService.bindChildNodes(this, {
              model,
              translationModel,
              recursive,
              chainPrefix: chainWithoutPrefix,
              enableTranslations,
            });

            this.removeListeners();
            this.listeners = new ComponentListenersService(this, {
              model,
              translationModel,
              chain: chainWithoutPrefix,
            });
            this.listeners.getModel.add();
            this.listeners.getTranslationModel.add();
            this.listeners.getParentChain.add();

            this.removeAttribute(DISABLE_BINDING);
            this.classList.add(HYDRATED);
          }

          disconnectedCallback() {
            this.classList.remove(HYDRATED);
            this.removeListeners();
          }

          async getModel() {
            return this.model;
          }

          async getTranslationModel() {
            return this.translationModel;
          }

          async getParentChain() {
            return this.parentChain;
          }

          async componentOnReady() {
            async function timeoutAsync(time) {
              return new Promise(resolve => setTimeout(resolve, time));
            }

            while (!this.hasAttribute(HYDRATED)) {
              await timeoutAsync(10);
            }
          }
        },
      );

      tagNames.add(tagName);
    },
  };
}
