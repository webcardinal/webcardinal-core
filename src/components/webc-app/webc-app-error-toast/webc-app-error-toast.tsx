import { Component, Listen } from '@stencil/core';

import { HostElement } from '../../../decorators';
import type { WebcAppError } from '../../../interfaces';

@Component({
  tag: 'webc-app-error-toast',
  styleUrls: {
    default: '../../../styles/webc-app-error-toast/webc-app-error-toast.scss',
  },
})
export class WebcAppErrorToast {
  @HostElement() host: HTMLElement;

  @Listen('webcAppWarning', { target: 'window' })
  handleAppWarning(event: CustomEvent<any[]>) {
    if (event.detail?.length) {
      this.addToast('warning', this.getWarningToastContent([...event.detail]));
    }
  }

  @Listen('webcAppError', { target: 'window' })
  handleAppError(event: CustomEvent<WebcAppError>) {
    this.addToast('error', this.getErrorToastContent(event.detail));
  }

  getErrorToastContent(appError: WebcAppError) {
    const { message, url, lineNo, columnNo, error, isScriptError } = appError;

    let detailsSection = '';
    let seeMore = '';

    if (!isScriptError) {
      seeMore = `<span class="see-more">[See more]</span>`;
      detailsSection = `
            <div class="see-more-content">${
              error ? error.stack.replace(/(?:\r\n|\r|\n)/g, '<br>').replace(/ /g, '\u00a0') : ''
            }</div>
            <div class="details">
                URL: ${url}<br />
                Line: ${lineNo} / Column: ${columnNo}<br />
            </div>
        `;
    }

    return `
        <div class="title">
            <button type="button" class="close">
                <span aria-hidden="true">&times;</span>
            </button>
            <div class="message">${message} ${seeMore}</div>
        </div>
        ${detailsSection}
    `;
  }

  getWarningToastContent(params: any[]) {
    return `
        <div class="title">
            <button type="button" class="close">
                <span aria-hidden="true">&times;</span>
            </button>
            <div class="message">${params.join('<br/>')}</div>
        </div>
    `;
  }

  addToast(toastType: string, content: string) {
    const toast = document.createElement('div');
    toast.className = `webc-toast ${toastType}`;
    toast.innerHTML = content;

    this.host.append(toast);

    const seeMoreButton = toast.querySelector('.see-more');
    if (seeMoreButton) {
      seeMoreButton.addEventListener('click', () => {
        seeMoreButton.remove();
        const seeMoreContent = toast.querySelector('.see-more-content');
        if (seeMoreContent) {
          seeMoreContent.classList.add('show');
        }
      });
    }

    toast.querySelector('button.close').addEventListener('click', () => {
      toast.classList.add('closing');
      setTimeout(() => toast.remove(), 490);
    });
  }

  render() {
    return null;
  }
}
