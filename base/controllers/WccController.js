import Controller from "./Controller";

class WccController extends Controller {
  constructor(element, history) {
    super(element, history);
  }

  showModal(text, modalTitle, onConfirm, onClose) {
    if (!modalTitle) {
      modalTitle = "Info";
    }
    this.createWccModal({
      modalTitle,
      text,
      onConfirm,
      onClose,
    });
  }

  showErrorModal(error, title, onConfirm, onClose) {
    let errorMessage;
    title = title ? title : "Validation Error";

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "object") {
      errorMessage = error.toString();
    } else {
      errorMessage = error;
    }

    this.createWccModal({
      modalTitle: title,
      text: errorMessage,
      canClose: false,
      showCancelButton: false,
      onConfirm,
      onClose,
    });
  }

  showErrorModalAndRedirect(errorText, page, timeout) {
    if (!timeout) {
      timeout = 5000;
    }
    this.hideModal();

    this.createWccModal({
      modalTitle: "Error",
      text: errorText,
      canClose: false,
      showCancelButton: false,
      showFooter: false,
    });

    setTimeout(() => {
      this.hideModal();
      console.log(`Redirecting to ${page}...`);
      this.navigateToPageTag(page);
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
