import type { LogLevel } from '../interfaces';

// events
export * from './events';

// data-model
export const MODEL_KEY = 'data-model';
export const MODEL_CHAIN_PREFIX = '@';
export const TRANSLATION_CHAIN_PREFIX = '$';
export const SKIP_BINDING_FOR_PROPERTIES = ['_saveElement'];
export const SKIP_BINDING_FOR_COMPONENTS = ['webc-for', 'webc-if', 'webc-template'];
export const PSK_CARDINAL_PREFIX = 'psk-';

// data-for attribute
export const DATA_FOR_ATTRIBUTE = 'data-for';
export const DATA_FOR_NO_DATA_SLOT_NAME = 'no-data';

// data-if attribute
export const DATA_IF_ATTRIBUTE = 'data-if';
export const DATA_IF_TRUE_CONDITION_SLOT_NAME = 'true';
export const DATA_IF_FALSE_CONDITION_SLOT_NAME = 'false';

// others
export const LOG_LEVEL: {
  [key: string]: LogLevel;
} = {
  NONE: 'none',
  WARN: 'warn',
  ERROR: 'error',
};
