import Controller from './Controller';

class WebcController extends Controller {
  constructor(element, history) {
    super(element, history);
  }

  showModal(text, title, onConfirm, onClose) {
    title = title ? title : 'Info';
    this.createWebcModal({
      modalTitle: title,
      text,
      onConfirm,
      onClose,
    });
  }

  showModalFromTemplate(modalName, onConfirm, onClose) {
    return this.createWebcModal({
      modalName,
      onConfirm,
      onClose,
    });
  }

  showErrorModal(error, title, onConfirm, onClose) {
    let modalTitle = title ? title : 'Error';
    let text;

    if (error instanceof Error) {
      text = error.message;
    } else if (typeof error === 'object') {
      text = error.toString();
    } else {
      text = error;
    }

    this.createWebcModal({
      modalTitle,
      text,
      canClose: false,
      showCancelButton: false,
      onConfirm,
      onClose,
    });
  }

  showErrorModalAndRedirect(error, title, url, timeout) {
    let modalTitle = title ? title : 'Error';
    let text;

    if (error instanceof Error) {
      text = error.message;
    } else if (typeof error === 'object') {
      text = error.toString();
    } else {
      text = error;
    }

    if (!timeout) {
      timeout = 5000;
    }
    this.hideModal();

    this.createWebcModal({
      modalTitle,
      text,
      canClose: false,
      showCancelButton: false,
      showFooter: false,
    });

    setTimeout(() => {
      this.hideModal();
      console.log(`Redirecting to ${url}...`);
      this.navigateToUrl(url);
    }, timeout);
  }

  createWebcModal({
    modalTitle,
    modalName,
    text,
    canClose,
    showCancelButton,
    showFooter,
    onConfirm,
    onClose,
  }) {
    if (!onClose) {
      onClose = onConfirm;
    }

    const modal = this.createAndAddElement('webc-modal', {
      modalTitle,
      modalName,
      text,
      canClose,
      showFooter,
      showCancelButton,
    });

    modal.addEventListener('confirmed', e => {
      onConfirm && onConfirm(e);
      modal.remove();
    });
    modal.addEventListener('closed', e => {
      onClose && onClose(e);
      modal.remove();
    });
    return modal;
  }

  hideModal() {
    this.element
      .querySelectorAll('webc-modal')
      .forEach(modal => modal.remove());
  }
}

export default WebcController;
