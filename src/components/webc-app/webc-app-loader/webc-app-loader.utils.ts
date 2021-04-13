export async function checkPageExistence(pageSrc) {
  try {
    const response = await fetch(pageSrc, { method: 'head' })
    return response.ok === true;
  } catch (error) {
    console.log(
      `Error while checking a page from ${pageSrc}`,
      error,
    );
    return false;
  }
}

export async function loadPageContent(pageSrc) {
  try {
    const response = await fetch(pageSrc);
    const content = await response.text();
    if (!response.ok) {
      throw new Error(content);
    }
    return content;
  } catch (error) {
    console.log(
      `Error while loading a page from ${pageSrc}`,
      error,
    );
    return null;
  }
}
