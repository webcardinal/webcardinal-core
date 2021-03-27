const modals = {};

export const getModalTemplate = async template => {
  const { basePath } = window.WebCardinal;

  if (modals[template]) {
    return modals[template];
  }

  const modalPath = `${basePath}/modals/${template}.html`;

  try {
    const response = await fetch(modalPath);
    const content = await response.text();
    if (!response.ok) {
      throw new Error(content);
    }
    modals[template] = content;
    return content;
  } catch (error) {
    console.log(
      `Error while loading ${template} modal at ${modalPath}`,
      error,
    );
    return null;
  }
};
