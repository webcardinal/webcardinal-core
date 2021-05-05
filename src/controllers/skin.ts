import { getSkinFromState, getSkinPathFromState, URLHelper } from '../utils';
import { ASSETS_PATH, ID_CUSTOM_SKIN_CSS, ID_DEFAULT_SKIN_CSS } from '../constants';

const { join } = URLHelper;

let skin, skinPath;

function isValidWebCardinalPlacement() {
  const webcardinal =
    document.body.querySelector('link[href$="webcardinal.css"]') &&
    document.body.querySelector('script[src$="webcardinal.js"]');
  if (webcardinal) {
    console.error(
      [
        `WebCardinal distribution must be added in <head> of index.html`,
        `In the case of current application WebCardinal is added in the <body>`,
        `As a result skin.css can not be applied!`,
      ].join('\n'),
    );
    return false;
  }
  return true;
}

function applyCustomSkin(container) {
  const stylesheet = Object.assign(document.createElement('link'), {
    rel: 'stylesheet',
    href: join(this.basePath, skinPath, ASSETS_PATH, 'skin.css').pathname.slice(1),
    id: ID_CUSTOM_SKIN_CSS,
  });
  container.insertAdjacentElement('afterend', stylesheet);
  return new Promise<void>(resolve => {
    stylesheet.addEventListener('load', () => resolve());
    stylesheet.addEventListener('error', () => {
      console.log('error for skin.css');
    })
  });
}

function applySkins(container) {
  const stylesheet = Object.assign(document.createElement('link'), {
    rel: 'stylesheet',
    href: join(this.basePath, ASSETS_PATH, 'skin.css').pathname.slice(1),
    id: ID_DEFAULT_SKIN_CSS,
  });
  container.insertAdjacentElement('afterend', stylesheet);
  return new Promise<void>(resolve => {
    stylesheet.addEventListener('load', async () => {
      if (skin === 'default') {
        resolve();
      }
      await applyCustomSkin.bind(this)(stylesheet);
      resolve();
    });
    stylesheet.addEventListener('error', () => {
      console.log('error for default skin.css');
    })
  });
}

function getWebCardinalStylesheet() {
  // in order to make local imports of the user with higher priority then skin.css
  let webcardinalStylesheet = document.head.querySelector('link[href$="webcardinal.css"]');
  if (!webcardinalStylesheet) {
    console.error(
      [
        `WebCardinal stylesheet not found!`,
        `Add <link rel="stylesheet" href="webcardinal/webcardinal.css"> in your "index.html"`,
      ].join('\n'),
    );

    // if stylesheet is missing, insert skins after WebCardinal distribution
    webcardinalStylesheet = document.head.querySelector('script[src$="webcardinal.js"]');
  }
  return webcardinalStylesheet;
}

/**
 * Waiting for skin.css is mandatory since some Custom Properties are taken into account by webc-app-root
 * For example if "--mode: mobile" is present webc-app-root will render accordingly
 */
export default async function () {
  if (isValidWebCardinalPlacement()) {
    skin = getSkinFromState();
    skinPath = getSkinPathFromState();
    await applySkins.bind(this)(getWebCardinalStylesheet());
  }
}
