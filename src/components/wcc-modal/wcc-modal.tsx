import {
  Component,
  h,
  Prop,
  Event,
  EventEmitter,
  Fragment,
} from "@stencil/core";
import { HostElement } from "../../decorators";

@Component({
  tag: "wcc-modal",
  styleUrls: {
    default: "../../styles/wcc-modal/wcc-modal.scss",
  },
  shadow: true,
})
export class WccModal {
  @HostElement() private host: HTMLElement;

  @Prop({ reflect: true }) modalTitle: string;
  @Prop({ reflect: true }) closeButtonText: string = "Close";
  @Prop({ reflect: true }) confirmButtonText: string = "Ok";

  @Prop({ reflect: true }) autoClose: boolean = true;

  @Event() confirmed: EventEmitter<any>;
  @Event() closed: EventEmitter<any>;

  handleBackdropClick(e: MouseEvent) {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (this.autoClose && e.target === e.currentTarget) {
      this.closed.emit();
    }
  }

  handleClose(e: MouseEvent) {
    e.preventDefault();
    e.stopImmediatePropagation();
    this.closed.emit();
  }

  handleConfirm(e: MouseEvent) {
    e.preventDefault();
    e.stopImmediatePropagation();
    this.confirmed.emit();
  }

  hasTitleSlot() {
    return !!this.host.querySelector('[slot="title"]');
  }

  hasFooterSlot() {
    return !!this.host.querySelector('[slot="footer"]');
  }

  render() {
    return (
      <div
        class="modal fade show"
        tabindex="-1"
        role="dialog"
        onClick={this.handleBackdropClick.bind(this)}
      >
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              {this.hasTitleSlot() ? (
                <slot name="title" />
              ) : (
                <h2 class="modal-title">{this.modalTitle}</h2>
              )}

              <button
                type="button"
                class="close"
                data-dismiss="modal"
                aria-label="Close"
                onClick={this.handleClose.bind(this)}
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

            <div class="modal-body">
              <slot />
            </div>

            <div class="modal-footer">
              {this.hasFooterSlot() ? (
                <slot name="footer" />
              ) : (
                <Fragment>
                  <button
                    type="button"
                    class="btn btn-secondary"
                    onClick={this.handleClose.bind(this)}
                  >
                    {this.closeButtonText}
                  </button>

                  <button
                    type="button"
                    class="btn btn-primary"
                    onClick={this.handleConfirm.bind(this)}
                  >
                    {this.confirmButtonText}
                  </button>
                </Fragment>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

WccModal;
