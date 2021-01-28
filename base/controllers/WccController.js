import Controller from "./Controller";

class WccController extends Controller {
  constructor(element, history) {
    super(element, history);
  }

  showModal(text, title, onConfirm, onClose) {
    title = title ? title : "Info";
    this.createWccModal({
      modalTitle: title,
      text,
      onConfirm,
      onClose,
    });
  }

  showErrorModal(error, title, onConfirm, onClose) {
    let modalTitle = title ? title : "Error";
    let text;

    if (error instanceof Error) {
      text = error.message;
    } else if (typeof error === "object") {
      text = error.toString();
    } else {
      text = error;
    }

    this.createWccModal({
      modalTitle,
      text,
      canClose: false,
      showCancelButton: false,
      onConfirm,
      onClose,
    });
  }

  showErrorModalAndRedirect(error, title, url, timeout) {
    let modalTitle = title ? title : "Error";
    let text;

    if (error instanceof Error) {
      text = error.message;
    } else if (typeof error === "object") {
      text = error.toString();
    } else {
      text = error;
    }

    if (!timeout) {
      timeout = 5000;
    }
    this.hideModal();

    this.createWccModal({
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

  createWccModal({
    modalTitle,
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

    const modal = this.createAndAddElement("wcc-modal", {
      modalTitle,
      text,
      canClose,
      showFooter,
      showCancelButton,
    });

    modal.addEventListener("confirmed", () => {
      onConfirm && onConfirm();
      modal.remove();
    });
    modal.addEventListener("closed", () => {
      onClose && onClose();
      modal.remove();
    });
  }

  hideModal() {
    this.element
      .querySelectorAll("wcc-modal")
      .forEach((modal) => modal.remove());
  }
}

export default WccController;
