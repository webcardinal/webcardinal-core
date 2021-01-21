const modals = {};

const ModalRegistryService = {
  getModal: (modalName) => {
    const { basePath } = window.WebCardinal;

    if (modals[modalName]) {
      return Promise.resolve(modals[modalName]);
    }

    const modalPath = `${basePath}/modals/${modalName}.html`;
    return fetch(modalPath)
      .then(function (response) {
        const content = response.text();
        modals[modalName] = content;
        return content;
      })
      .catch((error) => {
        console.log(
          `Error while loading ${modalName} modal at ${modalPath}`,
          error
        );
        throw error;
      });
  },
};

export default ModalRegistryService;
