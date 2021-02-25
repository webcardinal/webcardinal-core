import {
  MODEL_CHAIN_PREFIX,
  SKIP_BINDING_FOR_COMPONENTS,
  TRANSLATION_CHAIN_PREFIX,
} from '../constants';

function bindRecursive(element: ChildNode, model: any, translationModel: any) {
  Array.from(element.childNodes).forEach(childNode => {
    ControllerNodeValueBindingService.bindNodeValue(
      childNode,
      model,
      translationModel,
    );
    if (childNode.hasChildNodes()) {
      bindRecursive(childNode, model, translationModel);
    }
  });
}

const ControllerNodeValueBindingService = {
  /**
   * @description - Binds all attributes and values from the model for any child of the element
   * @param element
   * @param model
   */
  bindRecursive: (element: ChildNode, model: any, translationModel: any) => {
    const tagName = element.nodeName.toLowerCase();
    if (!model) {
      console.warn(`No model found for ${tagName}!`);
      return;
    }
    if (!translationModel) {
      console.warn(`No model found for ${tagName}!`);
      return;
    }
    // for some webc-<components> binding is managed by component itself
    if (SKIP_BINDING_FOR_COMPONENTS.includes(element.nodeName.toLowerCase())) {
      return;
    }

    bindRecursive(element, model, translationModel);
  },

  bindNodeValue: (node: ChildNode, model: any, translationModel: any) => {
    // for some webc-<components> binding is managed by component itself
    if (SKIP_BINDING_FOR_COMPONENTS.includes(node.nodeName.toLowerCase())) {
      return;
    }

    if (
      node.nodeType !== Node.TEXT_NODE ||
      !node.nodeValue ||
      !node.nodeValue.trim()
    ) {
      // the current node is either not a text node or has an empty value
      return;
    }

    const bindingExpressionTexts = [
      ...node.nodeValue.matchAll(/\{\{\s*([^\s}}]+)\s*\}\}/g),
    ];
    if (!bindingExpressionTexts.length) {
      // no binding expressions were found
      return;
    }

    const bindingExpressions = bindingExpressionTexts
      .map(x => {
        return {
          expression: x[0],
          chainWithPrefix: x[1],
        };
      })
      .filter(({ chainWithPrefix }) => {
        return (
          chainWithPrefix.startsWith(MODEL_CHAIN_PREFIX) ||
          chainWithPrefix.startsWith(TRANSLATION_CHAIN_PREFIX)
        );
      })
      .map(expression => {
        const isTranslation = expression.chainWithPrefix.startsWith(
          TRANSLATION_CHAIN_PREFIX,
        );
        const chain = expression.chainWithPrefix.slice(1);
        const currentModel = isTranslation ? translationModel : model;
        return {
          ...expression,
          chain,
          isTranslation,
          isModel: !isTranslation,
          model: currentModel,
          getChainValue: () => {
            let value = currentModel.getChainValue(chain);
            if (isTranslation && value === undefined) {
              const { language } = window.WebCardinal;
              const { pathname } = window.location;

              console.warn(
                `No translations found for language ${language}, page ${pathname} and key ${chain}`,
              );

              // we have a translation for a missing key, so we return the translation key (chain)
              value = chain;
            }
            return value;
          },
        };
      });

    if (!bindingExpressions.length) {
      // no supported binding found
      return;
    }

    const originalNodeValue = node.nodeValue;

    const updateNodeValue = () => {
      let updatedNodeValue = originalNodeValue;
      bindingExpressions.forEach(({ expression, getChainValue }) => {
        updatedNodeValue = updatedNodeValue.replace(
          expression,
          getChainValue(),
        );
      });
      node.nodeValue = updatedNodeValue;
    };

    updateNodeValue();

    bindingExpressions
      .filter(x => x.isModel)
      .forEach(({ chain }) => {
        model.onChange(chain, () => {
          updateNodeValue();
        });
      });
  },
};

export default ControllerNodeValueBindingService;