import type { ComponentInterface } from '@stencil/core';
import { getElement } from '@stencil/core';

const ATTRIBUTE = 'attr';
const PROPERTY = 'prop';

function normalizeModelChain(chain) {
  if (typeof chain !== 'string') {
    throw new Error('Invalid model chain');
  }
  return chain.split('@').join('');
}

function dashToCamelCase(str) {
  return str.replace(/-([a-z])/g, function (g) {
    return g[1].toUpperCase();
  });
}

function hasChainSignature(property) {
  if (property === null || typeof property !== 'string') {
    return false;
  }
  if (!property.startsWith('@')) {
    return false;
  }
  return property.length >= 1;
}

function attributeHasValidChain(attr, attrValue, properties) {
  if (!hasChainSignature(attrValue)) {
    return false;
  }

  if (typeof properties[dashToCamelCase(attr)] !== 'undefined') {
    return false;
  }

  return attr !== 'view-model';
}

function getUpdateHandler(type, model) {
  switch (type) {
    case ATTRIBUTE:
      return function (attr, boundedChain) {
        this.setAttribute(attr, model.getChainValue(boundedChain));
      };
    default:
      return function (property, boundedChain) {
        const newValue = model.getChainValue(boundedChain);
        if (Array.isArray(this[property])) {
          this[property] = [...newValue];
        } else {
          this[property] = newValue;
        }
      };
  }
}

function BoundedModel(updateHandler, model) {
  this.createBoundedModel = function (property, boundedChain) {
    boundedChain = normalizeModelChain(boundedChain);

    model.onChange(boundedChain, () => {
      updateHandler(property, boundedChain);
    });

    updateHandler(property, boundedChain);

    return {
      updateModel: value => {
        model.setChainValue(boundedChain, value);
      },
    };
  };
}

function bindComponentProps(element, propsData, callback) {
  const { properties, hasViewModel, instanceName } = propsData;

  const modelReceived = (err, model) => {
    if (err) {
      console.error(err);
    }

    let viewModelParentChain;
    const boundedProperties = {};

    const bindSingleProperty = prop => {
      if (!boundedProperties[prop]) {
        const instance = properties[prop].type === ATTRIBUTE ? element : this;
        const handler = getUpdateHandler.call(
          instance,
          properties[prop].type,
          model,
        );
        const propViewModel = new BoundedModel(handler.bind(instance), model);
        boundedProperties[prop] = propViewModel.createBoundedModel(
          prop,
          properties[prop].value,
        );
      }
    };

    const bindProperties = () => {
      for (const prop in properties) {
        bindSingleProperty(prop);
      }
    };

    /**
     * if view-model is defined, construct the property dictionary but do not overwrite existing
     * properties
     */
    if (hasViewModel) {
      viewModelParentChain = element.getAttribute('view-model');
      viewModelParentChain = normalizeModelChain(viewModelParentChain);

      const updateProperties = () => {
        const propertiesData = model.getChainValue(viewModelParentChain);
        for (const prop in propertiesData) {
          if (!properties[prop]) {
            properties[prop] = {
              value: viewModelParentChain
                ? viewModelParentChain + '.' + prop
                : prop,
              type: PROPERTY,
            };
          }
        }
      };

      updateProperties();

      /**
       * This model chain listener set on the view model parent chain is used for the those children chains (of this parent chain) which are added at the runtime, and are not bound.
       * The below part of the code is updating and binding these new children chains to the component.
       */
      model.onChange(viewModelParentChain, () => {
        updateProperties();
        bindProperties();
      });
    }

    bindProperties();

    if (typeof this[instanceName] !== 'undefined') {
      throw new Error(
        `BindModel decorator received a wrong argument as instance name: [${instanceName}]`,
      );
    } else {
      this[instanceName] = {
        updateModel: (prop, value) => {
          if (!properties[prop]) {
            properties[prop] = {
              value: viewModelParentChain
                ? viewModelParentChain + '.' + prop
                : prop,
              type: PROPERTY,
            };
            bindSingleProperty(prop);
          }

          boundedProperties[prop].updateModel(value);
        },
      };
    }
    callback();
  };

  element.dispatchEvent(
    new CustomEvent('getModelEvent', {
      bubbles: true,
      composed: true,
      detail: { callback: modelReceived },
    }),
  );
}

export default function BindModel() {
  return (proto: ComponentInterface, instanceName?) => {
    const { componentWillLoad } = proto;

    proto.componentWillLoad = function () {
      const componentInstance = this.__proto__;
      const self = this;
      const element: HTMLElement = getElement(self);

      const callComponentWillLoad = (promise?) => {
        if (!promise) {
          return componentWillLoad && componentWillLoad.call(self);
        } else {
          return new Promise(resolve => {
            promise.then(() => {
              resolve(componentWillLoad && componentWillLoad.call(self));
            });
          });
        }
      };

      if (element.isConnected) {
        const componentProperties = Object.keys(componentInstance);
        const elementAttributes = element.getAttributeNames();
        const properties = {};

        /**
         * iterate through component properties and search for model chains
         */
        for (let i = 0; i < componentProperties.length; i++) {
          const prop = componentProperties[i];
          if (hasChainSignature(this[prop])) {
            properties[prop] = {
              value: this[prop],
              type: PROPERTY,
            };
          }
        }

        /**
         * iterate through component attributes and search for model chains
         */
        for (let i = 0; i < elementAttributes.length; i++) {
          const attr = elementAttributes[i];
          const attrValue = element.getAttribute(attr);
          if (attributeHasValidChain(attr, attrValue, properties)) {
            properties[attr] = {
              value: attrValue,
              type: ATTRIBUTE,
            };
          }
        }

        /**
         * check for existing view-model attribute
         */
        const hasViewModel = element.hasAttribute('view-model');
        if (Object.keys(properties).length > 0 || hasViewModel) {
          return callComponentWillLoad(
            new Promise(resolve => {
              const propsData = {
                properties: properties,
                hasViewModel: hasViewModel,
                instanceName: instanceName,
              };
              bindComponentProps.call(self, element, propsData, resolve);
            }),
          );
        }
      }
      return callComponentWillLoad();
    };
  };
}
