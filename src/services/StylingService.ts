const STYLED_TAG = 'data-styled';
const SHADOW_TAG = 'data-shadow';
const RULES_REG_EXP = /(.+?){([\w\W]*?)}/g;
const COMMENTS_REG_EXP = /\/\*[\w\W]*?\*\//g;
const MEDIA_QUERIES_REG_EXP = /@media(.+?){([\s\n]*((.+?){([\w\W]*?)})*?[\s\n]*)*[\s\n]*}/g;
const SELECT_SPLIT_REG_EXP = /[~>+ ]/;

export default class StylingService {
  private readonly host: HTMLElement;
  private readonly target: HTMLElement;

  constructor(host: HTMLElement, target: HTMLElement) {
    this.host = host;
    this.target = target;
  }

  public async applyFromHref(href) {
    const styleText = await StylingService.fetchSource(href);
    await this.applyFromStyleText(styleText);
  }

  public async applyFromStyleText(styleText: string) {
    styleText = StylingService.removeComments(styleText);

    // let mediaQueries = StylingService.getMediaQueries(styleText);

    styleText = StylingService.removeMediaQueries(styleText);

    let rules = StylingService.getRules(styleText);

    for (let [selector, properties] of Object.entries(rules) as any) {
      this.applyProperties(this.host, selector, properties);
    }
  }

  private applyProperties(host, selector, properties) {
    const elements = host.querySelectorAll(selector);

    if (elements.length > 0) {
      if (!host.host) {
        console.warn(
          `You must use custom styling only when you want to customise a #shadow-root (document fragment)\n`,
          `In this case use a "link ref='stylesheet'" or a "style" element!\n`,
          `Read the docs regarding to "${SHADOW_TAG}" attribute!\n`,
          `target selector: "${selector}"\n`,
          `target element:`, this.target
        );
      }

      let hostStyles = [];
      for (let i = 0; i < elements.length; i++) {
        hostStyles.push(`${selector}{${properties}}`);
      }

      let styleElement = host.querySelector(`[${STYLED_TAG}]`);
      if (!styleElement) {
        styleElement = StylingService.appendStyle(host, '');
      }

      if (hostStyles.length > 0) {
        styleElement.append(hostStyles.join('\n'));
      }

      return;
    }

    let arrayOfSelectors = selector.split(SELECT_SPLIT_REG_EXP).filter(String);
    let shadowSelector = '';

    for (let part of arrayOfSelectors) {
      if (part.endsWith(`[${SHADOW_TAG}]`)) {
        shadowSelector = part;
        break;
      }
    }

    if (!shadowSelector) {
      return;
    }

    let [beforeSelector, afterSelector] = selector.split(shadowSelector);
    selector = beforeSelector + shadowSelector.replace(`[${SHADOW_TAG}]`, '');

    let shadowElements = host.querySelectorAll(selector);
    for (let element of shadowElements) {
      if (element.shadowRoot) {
        this.applyProperties(element.shadowRoot, `${afterSelector.trim()}`, properties);
      }
    }
  }

  private static async fetchSource(sourcePath) {
    try {
      const response = await fetch(sourcePath);
      return response.ok ? await response.text() : '';
    } catch (error) {
      console.error(error);
      return '';
    }
  }

  private static removeComments(styleText: string) {
    return styleText.replace(COMMENTS_REG_EXP, '').trim();
  }

  private static removeMediaQueries(styleText: string) {
    return styleText.replace(MEDIA_QUERIES_REG_EXP, '').trim();
  }

  /**
   * @futureOff
   **/
  // private static getMediaQueries(styleText: string) {
  //   let regex = MEDIA_QUERIES_REG_EXP;
  //   let queries = [];
  //   for (let rule of Array.from((styleText as any).matchAll(regex))) {
  //     if (Array.isArray(rule) && rule.length < 2) {
  //       continue;
  //     }
  //     let query = rule[1].trim();
  //     let rules = StylingService.getRules(rule[2]);
  //     queries.push({ query, rules });
  //   }
  //   return queries;
  // }

  private static getRules(styleText: string) {
    let regex = RULES_REG_EXP;
    let rules = {};
    for (let rule of Array.from((styleText as any).matchAll(regex))) {
      if (Array.isArray(rule) && rule.length < 2) {
        continue;
      }
      let selector = rule[1].trim();
      if (selector.startsWith('@')) {
        continue;
      }
      rules[selector] = rule[2].split(';').map(i => i.trim()).filter(String).join(';');
    }
    return rules;
  }

  private static appendStyle(host: HTMLElement, styleText: string) {
    const styleElement = document.createElement('style');
    styleElement.setAttribute(STYLED_TAG, '');
    styleElement.innerText = styleText;
    host.append(styleElement);
    return styleElement;
  }
}
