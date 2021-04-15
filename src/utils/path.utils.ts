import { SKINS_PATH } from '../constants';

function trim(path) {
  return trimEnd(trimStart(path));
}

function trimStart(path = '') {
  return path.startsWith('/') ? path.slice(1) : path;
}

function trimEnd(path = '') {
  return path.endsWith('/') ? path.slice(0, -1) : path;
}

export const URLHelper = {
  trim,

  trimEnd,

  trimStart,

  join: (base, ...paths) => {
    let result = new URL(trimEnd(window.location.origin) + '/');
    for (let path of paths) {
      path = trimEnd(path);
      if (path === '') continue;
      result = new URL(path + '/', result);
    }

    base = trim(base);
    if (base !== '') {
      result = new URL(base + '/' + trim(result.pathname), trim(result.origin));
    }

    return {
      href: trimEnd(result.href),
      pathname: trimEnd(result.pathname) || '/',
    };
  },
};

export async function loadHTML(path) {
  try {
    const response = await fetch(`${path}.html`);
    const content = await response.text();
    if (!response.ok) {
      throw new Error(content);
    }
    return [null, content];
  } catch (error) {
    return [error];
  }
}

export async function loadJS(path) {
  try {
    const script = await import(`${path}.js`);
    return script.default || script;
  } catch (error) {
    // console.error(error);
    return;
  }
}

export async function loadJSON(path) {
  try {
    const response = await fetch(`${path}.json`);
    if (!response.ok) {
      const content = await response.text();
      throw new Error(content);
    }
    const json = await response.json();
    return [null, json];
  } catch (error) {
    return [error]
  }
}

export function getTranslationsFromState(): boolean {
  if (!window.WebCardinal?.state?.translations || typeof window.WebCardinal?.state?.translations !== 'boolean') {
    console.warn([
      `Preferred "translations" can not be found in WebCardinal.state!`,
      `The fallback for translations is "true".`
    ].join('\n'), window.WebCardinal);
    return true;
  }
  return window.WebCardinal.state.translations;
}

export function getSkinFromState(): string {
  if (!window.WebCardinal?.state?.skin || typeof window.WebCardinal?.state?.skin !== 'string') {
    console.warn([
      `Preferred "skin" can not be found in WebCardinal.state!`,
      `The fallback for skin is "default".`
    ].join('\n'), window.WebCardinal);
    return 'default';
  }
  return window.WebCardinal.state.skin;
}

export function getSkinPathFromState(): string {
  const skin = getSkinFromState();
  return skin !== 'default' ? `${SKINS_PATH}/${skin}` : '';
}
