import Controller from "./Controller";

class WccController extends Controller {
  constructor(element, history) {
    super(element, history);
  }

  showModal(text, modalTitle) {
    if (!modalTitle) {
      modalTitle = "Info";
    }
    this.createWccModal({
      modalTitle,
      text,
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
      onConfirm,
      onClose: onClose || onConfirm,
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
    showFooter,
    onConfirm,
    onClose,
  }) {
    const modal = this.createAndAddElement("wcc-modal", {
      modalTitle,
      text,
      canClose,
      showFooter,
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
