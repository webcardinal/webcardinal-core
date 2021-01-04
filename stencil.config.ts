import { Config as StencilConfig } from '@stencil/core';
import { sass } from '@stencil/sass'

export const config: StencilConfig = {
  namespace: 'cardinal',
  globalScript: './src/globals/mode.ts',
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
