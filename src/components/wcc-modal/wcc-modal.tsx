import {
  Component,
  h,
  Prop,
  Event,
  EventEmitter,
  Fragment,
  State,
  Method,
} from "@stencil/core";
import { HostElement } from "../../decorators";

import { getModalContent } from "./wcc-modal-utils";

@Component({
  tag: "wcc-modal",
  styleUrls: {
    default: "../../styles/wcc-modal/wcc-modal.scss",
  },
  shadow: true,
})
export class WccModal {
  @HostElement() private host: HTMLElement;

  @State() isLoading: boolean = false;
  @State() isVisible: boolean = false;
  @State() content: string;

  @Prop({ reflect: true }) modalName: string;
  @Prop({ reflect: true }) modalTitle: string;
  @Prop({ reflect: true }) modalTitleContent: string;
  @Prop({ reflect: true }) modalFooterContent: string;
  @Prop({ reflect: true }) closeButtonText: string = "Close";
  @Prop({ reflect: true }) confirmButtonText: string = "Ok";

  @Prop({ reflect: true, mutable: true }) autoShow: boolean = true;
  @Prop({ reflect: true }) autoClose: boolean = true;

  @Event() confirmed: EventEmitter<any>;
  @Event() closed: EventEmitter<any>;

  async componentWillLoad() {
    this.isLoading = true;
    if(this.autoShow) {
        this.isVisible = true;
    }

    this.content = await getModalContent(this.modalName);
    this.isLoading = false;
  }

  @Method()
  async show() {
    this.isVisible = true;
  }

  @Method()
  async hide() {
    this.isVisible = false;
  }

  @Method()
  async destroy() {
    this.host.remove();
  }

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

  render() {
    if (!this.isVisible) return null;

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
              {this.modalTitleContent ? (
                <div innerHTML={this.modalTitleContent}></div>
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

            {this.isLoading ? (
              <div class="modal-body">
                <wcc-spinner />
              </div>
            ) : (
              <Fragment>
                <div class="modal-body" innerHTML={this.content}></div>

                <div class="modal-footer">
                  {this.modalFooterContent ? (
                    <div innerHTML={this.modalFooterContent}></div>
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
              </Fragment>
            )}
          </div>
        </div>
      </div>
    );
  }
}

WccModal;
