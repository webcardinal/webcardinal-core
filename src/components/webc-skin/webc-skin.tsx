import { Component, h, Prop } from '@stencil/core';
import { HostElement } from '../../decorators';
import { StylingService } from '../../services';

@Component({
  tag: 'webc-skin',
})
export class WebcSkin {
  @HostElement() host: HTMLElement;

  @Prop() href: string

  private stylingService: StylingService;

  async componentDidLoad() {
    if (!this.host.parentElement) {
      return;
    }

    let isValid = false;
    this.stylingService = new StylingService(this.host.parentElement, this.host)

    if (this.href) {
      await this.stylingService.applyFromHref(this.href);
      isValid = true;
    }

    // let styleElement = this.host.querySelector('style');
    // if (styleElement) {
    //   await this.stylingService.applyFromStyleText(styleElement.innerText);
    //   isValid = true;
    // }

    if (!isValid) {
      console.warn(
        `${this.host.tagName.toLowerCase()} is not used properly\n`,
        `You must set attribute "href"!\n`,
        `target element:`, this.host
      )
    }
  }

  render() {
    return <slot />;
  }
}
