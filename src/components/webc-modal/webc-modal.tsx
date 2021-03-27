import type { EventEmitter } from '@stencil/core';
import { Component, Event, h, Method, Prop, State } from '@stencil/core';

import { HostElement } from '../../decorators';
import { bindChain } from '../../utils';

import { getModalTemplate } from './webc-modal-utils';

@Component({
  tag: 'webc-modal',
  styleUrls: {
    default: '../../styles/webc-modal/webc-modal.scss',
  },
  shadow: true,
})
export class WebcModal {
  @HostElement() private host: HTMLElement;

  @State() isLoading = false;
  @State() isVisible = false;

  /**
   * This property is a string that will permit the developer to choose his own controller.
   * If no value is set then the null default value will be taken and the component will use the basic Controller.
   */
  @Prop({ reflect: true }) controller: string;

  /**
   * The name of the model that will be loaded. The generated path will have the format <code>${basePath}/modals/${template}.html</code>.
   */
  @Prop({ reflect: true }) template: string;

  @Prop() model: any;

  @Prop() translationModel: any;

  /**
   * The text that will be shown in the modal's header, if the "header" slot is not provided.
   */
  @Prop({ reflect: true }) modalTitle: string;

  /**
   * The content that can be shown in the header, if provided and the "header" slot is missing from the content.
   */
  @Prop({ reflect: true }) modalDescription: string;

  /**
   * The content that will be shown in the modal body, if template is not provided.
   */
  @Prop({ reflect: true }) modalContent: string;

  /**
   * The content that can be shown in the footer, if provided and the "footer" slot is missing from the content.
   */
  @Prop({ reflect: true }) modalFooter: string;

  /**
   * The text that will appear on the footer close button, if neither the "footer" slot nor modalFooterContent are provided.
   */
  @Prop({ reflect: true }) cancelButtonText = 'Close';

  /**
   * The text that will appear on the footer confirm button, if neither the "footer" slot nor modalFooterContent are provided.
   */
  @Prop({ reflect: true }) confirmButtonText = 'Ok';

  /**
   * Sets if the modal expands to full screen.
   */
  @Prop({ reflect: true }) expanded = false;

  /**
   * Sets if the popup is centered on the screen or if it appear at the top of the screen.
   */
  @Prop({ reflect: true }) centered = true;

  /**
   * Sets if the modal will automatically show when the element is constructed.
   */
  @Prop({ reflect: true, mutable: true }) autoShow = true;

  /**
   * Sets if the modal can be closed
   */
  @Prop({ reflect: true }) disableClosing = false;

  /**
   * Sets if the modal will automatically close when the user clicks outside of it.
   */
  @Prop({ reflect: true }) disableBackdropClosing = true;

  /**
   * Decides if expand button should be displayed
   */
  @Prop({ reflect: true }) disableExpanding = false;

  /**
   * Sets if the modal has the footer displayed.
   */
  @Prop({ reflect: true }) disableFooter = false;

  /**
   * Sets if the close button will be shown or not.
   */
  @Prop({ reflect: true }) disableCancelButton = false;

  /**
   * Event that fires when the modal is initialised (after the modal content was successfully loaded).
   */
  @Event() initialised: EventEmitter<HTMLElement>;

  /**
   * Event that fires when the confirm button is pressed (only when the default footer is shown).
   */
  @Event() confirmed: EventEmitter;

  /**
   * Event that fires when the modal is pressed (only when the default footer is shown).
   * The event will be passed with a boolean value to specify if the popup was closed due to a button press (true) or a click outside of the popup (false)
   */
  @Event() closed: EventEmitter<boolean>;

  async componentWillLoad() {
    if (!this.host.isConnected) {
      return;
    }

    if (this.autoShow) {
      this.isVisible = true;
    }

    if (this.template) {
      this.isLoading = true;
      this.host.innerHTML = await getModalTemplate(this.template);
      this.isLoading = false;
    }

    this.initialised.emit(this.host);

    if (!this.controller) {
      await bindChain(this.host, {
        model: this.model,
        translationModel: this.translationModel
      });
    }

    const closingItems = this.host.querySelectorAll('[data-close]');
    const confirmingItems = this.host.querySelectorAll('[data-confirm]');

    if (closingItems) {
      closingItems.forEach(item => item.addEventListener('click', this.handleClose.bind(this)))
    }
    if (confirmingItems) {
      confirmingItems.forEach(item => item.addEventListener('click', this.handleConfirm.bind(this)))
    }
  }

  /**
   * Method that shows the modal.
   */
  @Method()
  async show() {
    this.isVisible = true;
  }

  /**
   * Method that hides the modal.
   */
  @Method()
  async hide() {
    this.isVisible = false;
  }

  /**
   * Method that completely removes the modal from the DOM.
   */
  @Method()
  async destroy() {
    this.host.remove();
  }

  handleBackdropClick(e: MouseEvent) {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (!this.disableClosing && !this.disableBackdropClosing && e.target === e.currentTarget) {
      this.closed.emit(false);
    }
  }

  handleClose(e: MouseEvent) {
    e.preventDefault();
    e.stopImmediatePropagation();
    this.closed.emit(true);
  }

  handleConfirm(e: MouseEvent) {
    e.preventDefault();
    e.stopImmediatePropagation();
    this.confirmed.emit({ modal: this.host, event: e });
  }

  handleExpand(e: MouseEvent) {
    e.preventDefault();
    e.stopImmediatePropagation();
    this.expanded = !this.expanded;
  }

  hasSlot(slotName) {
    return !!this.host.querySelector(`[slot="${slotName}"]`);
  }

  private getTitleContent() {
    if (this.hasSlot('header')) return <slot name="header" />;

    let content = [];
    if (this.modalTitle) content.push(<h2 class="modal-title">{this.modalTitle}</h2>);
    if (this.modalDescription) content.push(<p class="modal-description">{this.modalDescription}</p>);
    return content;
  }

  private getFooterContent() {
    if (this.hasSlot('footer')) return <slot name="footer" />;
    if (this.modalFooter) return <div innerHTML={this.modalFooter} />;
    return [
      !this.disableCancelButton && (
        <button type="button" class="cancel" part="cancel" onClick={this.handleClose.bind(this)}>
          {this.cancelButtonText}
        </button>
      ),
      <button type="button" class="confirm" part="confirm" onClick={this.handleConfirm.bind(this)}>
        {this.confirmButtonText}
      </button>,
    ];
  }

  render() {
    if (!this.isVisible) return null;

    const modal = (
      <div class="webc-modal fade show" tabindex="-1" role="dialog" onClick={this.handleBackdropClick.bind(this)}>
        <div class={`webc-modal-dialog ${this.centered ? 'centered' : ''} `} role="document">
          <div class="webc-modal-content">
            <section class="header" part="header">
              <div class="header-content">{this.getTitleContent()}</div>
              <div class="header-actions">
                {!this.disableExpanding && (
                  <button
                    type="button"
                    class="expand"
                    part="expand"
                    aria-label="Expand"
                    onClick={this.handleExpand.bind(this)}
                  />
                )}

                {!this.disableClosing && (
                  <button
                    type="button"
                    class="close"
                    part="close"
                    data-dismiss="modal"
                    aria-label="Close"
                    onClick={this.handleClose.bind(this)}
                  />
                )}
              </div>
            </section>

            {this.isLoading ? (
              <section class="body" part="body">
                <webc-spinner />
              </section>
            ) : (
              [
                <section class="body" part="body">
                  <slot />
                  {this.modalContent ? <div class="content">{this.modalContent}</div> : null}
                </section>,
                !this.disableFooter && (
                  <section class="footer" part="content">
                    {this.getFooterContent()}
                  </section>
                ),
              ]
            )}
          </div>
        </div>
      </div>
    );

    if (this.controller) {
      return <webc-container controller={this.controller} data-modal>{modal}</webc-container>;
    }

    return modal;
  }
}
