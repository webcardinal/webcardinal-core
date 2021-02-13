import { Component, h } from "@stencil/core";
import { HostElement } from "../../decorators";
import { StylingService } from "../../services";

@Component({
  tag: 'webc-skin'
})
export class WebcSkin {

  @HostElement() host: HTMLElement;

  private stylingService: StylingService;

  async componentWillLoad() {
    this.stylingService = new StylingService(this.host, 'en');
    await this.stylingService.apply();
  }

  render() {
    return <slot />;
  }
}
