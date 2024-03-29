import { HYDRATED } from "../../../constants";

export async function checkPageExistence(pageSrc) {
  try {
    // method 'head' is not supported by APIHUB
    const response = await fetch(pageSrc, { method: 'get' })
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

export function emitCompleteEventForSSAPP() {
  if (!window.frameElement) {
    return;
  }
  const iframeIdentity = window.frameElement.getAttribute('identity');
  const isHydrated = window.frameElement.classList.contains(HYDRATED);
  if (iframeIdentity && !isHydrated) {
    window.frameElement.classList.add(HYDRATED);
    window.parent.document.dispatchEvent(new CustomEvent(iframeIdentity, {
      detail: { status: 'completed' }
    }));
  }
}

