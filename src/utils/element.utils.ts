import {
  MODEL_CHAIN_PREFIX,
  MODEL_KEY,
  PSK_CARDINAL_PREFIX,
  SKIP_BINDING_FOR_COMPONENTS,
  SKIP_BINDING_FOR_PROPERTIES,
} from '../constants';

export function getClosestParentElement(element: HTMLElement, selector: string, stopSelector?: string): HTMLElement {
  let closestParent = null;
  while (element) {
    if (element.matches(selector)) {
      closestParent = element;
      break;
    } else if (stopSelector && element.matches(stopSelector)) {
      break;
    }
    element = element.parentElement;
  }
  return closestParent;
}

function isNativeProperty(key) {
  // these values are not visible as attributes over the HTMLElement
  return ['value', 'innerText', 'innerHTML'].includes(key);
}

function shortcutToProperty(key) {
  switch (key) {
    case 'model':
      return 'data-model';
    case 'tag':
      return 'data-tag';
    case 'text':
      return 'innerText';
    case 'html':
      return 'innerHTML';
    default:
      return key;
  }
}

export function setElementValue(element, { key, value }) {
  if (SKIP_BINDING_FOR_PROPERTIES.includes(key)) {
    return;
  }

  if (['innerHTML', 'innerText'].includes(key)) {
    console.warn(
      `Model property "${key}" can be short handed, try "${key.substr(5).toLowerCase()}" instead!\n`,
      `target element:`,
      element,
    );
  }
  if (['data-tag', 'data-model'].includes(key)) {
    console.warn(
      `Model property "${key}" can be shorthanded, try "${key.substr(5)}" instead!\n`,
      `target model:`,
      element.getAttribute('data-model'),
    );
  }

  key = shortcutToProperty(key);

  if (isNativeProperty(key)) {
    element[key] = value;
    return;
  }

  if (key === 'class') {
    if (value === '') {
      element.className = '';
      return;
    }

    if (typeof value === 'string') {
      element.classList.add(value);
      return;
    }

    if (typeof value === 'object') {
      for (const [className, active] of Object.entries(value)) {
        if (active) {
          element.classList.add(className);
        } else {
          element.classList.remove(className);
        }
      }
      return;
    }

    return;
  }

  if (typeof value === 'boolean') {
    if (value) {
      element.setAttribute(key, '');
    } else {
      element.removeAttribute(key);
    }
    return;
  }

  if (typeof value === 'string') {
    element.setAttribute(key, value);
    return;
  }

  if (typeof value === 'object') {
    element[key] = value;
    return;
  }
}

function isAttributeForModelChange(element: Element, attribute: string) {
  const tagName = element.tagName.toLowerCase();
  if (tagName === 'input' && element.getAttribute('type') === 'checkbox' && attribute === 'checked') {
    return true;
  }
  return attribute === 'value';
}

/**
 * @description - Binds all attributes for an Element
 * @param element
 * @param model - Object in which the specified chain (<attribute>="@chain") is searched
 */
export function bindElementAttributes(
  element: Element,
  model,
  chainPrefix = MODEL_CHAIN_PREFIX,
  modelChainPrefix: string = null,
) {
  // for some webc-<components> binding is managed by component itself
  if (SKIP_BINDING_FOR_COMPONENTS.includes(element.tagName.toLowerCase())) {
    return;
  }

  // for psk-<components> @BindModel decorator is design for this task
  if (element.tagName.startsWith(PSK_CARDINAL_PREFIX.toUpperCase())) {
    return;
  }

  Array.from(element.attributes).forEach(attribute => {
    const key = attribute.nodeName;
    let chain = attribute.nodeValue;

    if (key === MODEL_KEY) {
      return;
    }

    if (!chain.startsWith(chainPrefix)) {
      return;
    }
    chain = chain.slice(1);

    if (modelChainPrefix) {
      // prepend the modelChainPrefix
      chain = [modelChainPrefix, chain].filter(String).join('.');
    }

    setElementValue(element, { key, value: model.getChainValue(chain) });
    if (chainPrefix === MODEL_CHAIN_PREFIX && isAttributeForModelChange(element, key)) {
      bindElementChangeToModelProperty(element, model, chain);
    }

    model.onChange(chain, _ => {
      setElementValue(element, { key, value: model.getChainValue(chain) });
    });

    if (model.hasExpression(chain)) {
      setElementValue(element, { key, value: model.evaluateExpression(chain) });
      if (chainPrefix === MODEL_CHAIN_PREFIX && isAttributeForModelChange(element, key)) {
        bindElementChangeToModelProperty(element, model, chain);
      }

      model.onChangeExpressionChain(chain, _ => {
        setElementValue(element, { key, value: model.evaluateExpression(chain) });
      });
    }
  });
}

export function removeSlotInfoFromElement(element: Element) {
  // when nesting mutiple components that handle binding, the inner slots will have the hidden property set automatically
  // so we make sure to remove both the slot and hidden attributes
  if (element.nodeType !== Node.ELEMENT_NODE) {
    return;
  }
  element.removeAttribute('slot');
  element.removeAttribute('hidden');
}

export function bindElementChangeToModelProperty(element: Element, model, propertyChain) {
  const tagName = element.tagName.toLowerCase();
  if (['input', 'textarea'].includes(tagName)) {
    element.addEventListener('input', e => {
      const target = e.target as any;
      if (tagName === 'input' && element.getAttribute('type') === 'checkbox') {
        model.setChainValue(propertyChain, target.checked);
      } else {
        const updatedValue = target.value;
        model.setChainValue(propertyChain, updatedValue);
      }
    });
  } else if (tagName === 'select') {
    element.addEventListener('change', e => {
      const target = e.target as any;
      const updatedValue = target.value;
      model.setChainValue(propertyChain, updatedValue);
    });
  }
}

export function bindElementChangeToModel(element: Element, model, chain) {
  const targetModel = model.getChainValue(chain);
  if (!targetModel) {
    return;
  }

  const tagName = element.tagName.toLowerCase();
  const propertyChainSuffix = tagName === 'input' && element.getAttribute('type') === 'checkbox' ? 'checked' : 'value';

  const propertyChain = `${chain}.${propertyChainSuffix}`;
  bindElementChangeToModelProperty(element, model, propertyChain);
}

export function isAttributePresentOnElement(element: Element, attributeName: string) {
  return Array.from(element.attributes).some(attribute => attribute.nodeName === attributeName);
}

export function getSlots(elements: Element[], slotName: string) {
  const validElements = elements.filter(child => {
    return child.getAttribute('slot') === slotName;
  });

  return validElements;
}

export function getSlotContent(elements: Element[], slotName: string) {
  return getSlots(elements, slotName)
    .map(slotElement => {
      return slotElement.outerHTML;
    })
    .join('');
}

export function removeElementChildren(element: Element) {
  while (element.children.length > 0) {
    element.children[0].remove();
  }
}

export function removeElementChildNodes(element: Element) {
  while (element.childNodes.length > 0) {
    element.childNodes[0].remove();
  }
}
