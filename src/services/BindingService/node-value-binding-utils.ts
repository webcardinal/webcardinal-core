import { MODEL_CHAIN_PREFIX, SKIP_BINDING_FOR_COMPONENTS, TRANSLATION_CHAIN_PREFIX } from '../../constants';

export function bindNodeValue(node: ChildNode, model: any, translationModel: any, modelChainPrefix: string = null) {
  // for some webc-<components> binding is managed by component itself
  if (SKIP_BINDING_FOR_COMPONENTS.includes(node.nodeName.toLowerCase())) {
    return;
  }

  if (node.nodeType !== Node.TEXT_NODE || !node.nodeValue || !node.nodeValue.trim()) {
    // the current node is either not a text node or has an empty value
    return;
  }

  const bindingExpressionTexts = [...node.nodeValue.matchAll(/\{\{\s*([^\s}}]+)\s*\}\}/g)];
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
      return chainWithPrefix.startsWith(MODEL_CHAIN_PREFIX) || chainWithPrefix.startsWith(TRANSLATION_CHAIN_PREFIX);
    })
    .map(expression => {
      let { chainWithPrefix } = expression;
      const isTranslation = chainWithPrefix.startsWith(TRANSLATION_CHAIN_PREFIX);
      let chain = expression.chainWithPrefix.slice(1);
      if (!isTranslation && modelChainPrefix) {
        // prepend the modelChainPrefix
        chain = [modelChainPrefix, chain].filter(String).join('.');
        chainWithPrefix = `${MODEL_CHAIN_PREFIX}${chain}`;
      }

      const currentModel = isTranslation ? translationModel : model;
      return {
        ...expression,
        chain,
        isTranslation,
        isModel: !isTranslation,
        isModelExpression: currentModel.hasExpression(chain),
        evaluateModelExpression: () => currentModel.evaluateExpression(chain),
        model: currentModel,
        getChainValue: () => {
          let value = currentModel.getChainValue(chain);
          if (isTranslation && value === undefined) {
            const { language } = window.WebCardinal;
            const { pathname } = window.location;

            console.warn(`No translations found for language ${language}, page ${pathname} and key ${chain}`);

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
    bindingExpressions.forEach(({ expression, getChainValue, isModelExpression, evaluateModelExpression }) => {
      let value = getChainValue();
      if (!value && isModelExpression) {
        value = isModelExpression ? evaluateModelExpression() : '';
      }
      updatedNodeValue = updatedNodeValue.replace(expression, value || '');
    });
    node.nodeValue = updatedNodeValue;
  };

  updateNodeValue();

  bindingExpressions
    .filter(x => x.isModel)
    .forEach(({ model, chain, isModelExpression }) => {
      model.onChange(chain, () => {
        updateNodeValue();
      });

      if (isModelExpression) {
        model.onChangeExpressionChain(chain, () => {
          updateNodeValue();
        });
      }
    });
}
