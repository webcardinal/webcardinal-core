import { LogLevel } from '../interfaces';

// events
export * from './events';

// data-model
export const MODEL_KEY = 'data-model';
export const MODEL_CHAIN_PREFIX = '@';
export const SKIP_BINDING_FOR_PROPERTIES = ['_saveElement'];
export const SKIP_BINDING_FOR_COMPONENTS = ['wcc-for', 'wcc-if'];
export const PSK_CARDINAL_PREFIX = 'psk-';

// others
export const LOG_LEVEL: {
  [key: string]: LogLevel
} = {
  NONE: 'none',
  WARN: 'warn',
  ERROR: 'error',
};


