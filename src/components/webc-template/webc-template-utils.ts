const templates = {};

export const getTemplateContent = async templateName => {
  const { basePath } = window.WebCardinal;

  if (templates[templateName]) {
    return templates[templateName];
  }

  const templatePath = `${basePath}/templates/${templateName}.html`;

  try {
    const response = await fetch(templatePath);
    const content = await response.text();
    if (!response.ok) {
      throw new Error(content);
    }
    templates[templateName] = content;
    return content;
  } catch (error) {
    console.log(
      `Error while loading ${templateName} template at ${templatePath}`,
      error,
    );
    return null;
  }
};
