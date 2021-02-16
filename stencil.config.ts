import type { Config as StencilConfig } from '@stencil/core';
import { sass } from '@stencil/sass';

export const config: StencilConfig = {
  namespace: 'webcardinal',
  globalScript: './src/globals/mode.ts',
  globalStyle: './src/globals/main.css',
  outputTargets: [
    {
      type: 'dist',
      dir: 'build/dist',
    },
    { type: 'docs-readme' },
  ],
  plugins: [sass()],
};
