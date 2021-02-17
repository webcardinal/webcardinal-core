const modals = {};

export const getModalContent = async modalName => {
  const { basePath } = window.WebCardinal;

  if (modals[modalName]) {
    return modals[modalName];
  }

  const modalPath = `${basePath}/modals/${modalName}.html`;

  try {
    const response = await fetch(modalPath);
    const content = await response.text();
    if (!response.ok) {
      throw new Error(content);
    }
    modals[modalName] = content;
    return content;
  } catch (error) {
    console.log(
      `Error while loading ${modalName} modal at ${modalPath}`,
      error,
    );
    return null;
  }
};
