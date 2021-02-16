import { setMode } from '@stencil/core';

declare global {
  interface Window {
    [key: string]: any;
  }
}

export default () =>
  setMode(element => {
    return (element as any).mode || element.getAttribute('mode') || 'default';
  });
