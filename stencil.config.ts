import type { Config as StencilConfig } from '@stencil/core';
import { sass } from '@stencil/sass';
import { generator } from '@webcardinal/internals';

export interface WebCardinalConfig extends StencilConfig {
  readonly component: string
}

export const config: WebCardinalConfig = {
  component: '@webcardinal/core',
  namespace: 'webcardinal',
  globalScript: './src/globals/mode.ts',
  globalStyle: './src/globals/main.css',
  outputTargets: [
    {
      type: 'dist',
      dir: 'build/dist',
    },
    {
      type: 'docs-readme',
      dir: 'docs/readme',
      // strict: true,
      footer: '*Made by [WebCardinal](https://github.com/webcardinal) contributors.*'
    },
    {
      type: 'docs-custom',
      generator
    }
  ],
  plugins: [
    sass()
  ]
};
