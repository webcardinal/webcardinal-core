import { Config as StencilConfig } from '@stencil/core';
import { sass } from '@stencil/sass'

export const config: StencilConfig = {
  namespace: 'cardinal',
  globalScript: './src/globals/mode.ts',
  globalStyle: './src/globals/main.css',
  outputTargets: [
    {
      type: 'dist',
      dir: 'build/dist',
    }
  ],
  plugins: [
    sass()
  ]
}
