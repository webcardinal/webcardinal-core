import { EVENT_ROUTING_GET } from '../constants';
import { promisifyEventDispatch } from '../utils';

export default class StylingService {
  private readonly host: HTMLElement;
  private language: string;
  private routing: any;

  constructor(host, language) {
    this.host = host;
    this.language = language;
  }

  public async apply() {
    if (!window) {
      return;
    }

    const routing = await this.getRouting();

    if (!routing) {
      return;
    }

    let source = routing.mapping[window.location.pathname];
    if (source.startsWith('http')) {
      console.warn('Skins for external sources are not supported yet!');
      return;
    }
    if (!source.endsWith('.html')) {
      console.error('Unknown source', source);
      return;
    }
    source =
      this.routing.skinsPath +
      `/${this.language + source.substr(0, source.length - 4)}css`;

    console.log({ routing: this.routing });
    console.log({ source });

    // let styleSheet = new CSSStyleSheet();
    let styleText = await StylingService.fetchSource(source);
    styleText = StylingService.removeComments(styleText);

    // console.log({ styleText });
    // styleSheet.insertRule(styleText);
    // console.log({ styleSheet });

    // styleText.split(/[{}]/).filter(String).forEach(rule => {
    //   console.log(rule.trim());
    // })
  }

  public async getRouting() {
    if (!this.routing) {
      try {
        this.routing = await promisifyEventDispatch(
          EVENT_ROUTING_GET,
          this.host,
        );
      } catch (error) {
        console.error(error);
        return;
      }
    }

    return this.routing;
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

  private static removeComments(css: string) {
    return css.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '').trim();
  }
}
