import type { HookType, LogLevel } from '../interfaces';

// events
export * from './events';

// structure
export const PAGES_PATH = 'pages';
export const SKINS_PATH = 'skins';
export const TEMPLATES_PATH = 'templates';
export const MODALS_PATH = 'modals';
export const SCRIPTS_PATH = 'scripts';
export const CUSTOM_ELEMENTS_PATH = 'components';
export const ASSETS_PATH = 'assets';

// data-view-model
export const MODEL_KEY = 'data-model';
export const VIEW_MODEL_KEY = 'data-view-model';
export const DISABLE_BINDING = `disable-binding`;
export const MODEL_CHAIN_PREFIX = '@';
export const TRANSLATION_CHAIN_PREFIX = '$';
export const SKIP_BINDING_FOR_PROPERTIES = ['_saveElement'];
export const SKIP_BINDING_FOR_COMPONENTS = ['webc-template', 'webc-container', 'webc-component'];
export const PSK_CARDINAL_PREFIX = 'psk-';

// data-tag
export const TAG_ATTRIBUTE = 'data-tag';
export const TAG_MODEL_FUNCTION_PROPERTY = 'getDataTagModel';

// data-for
export const FOR_ATTRIBUTE = 'data-for';
export const FOR_NO_DATA_SLOT_NAME = 'no-data';
export const FOR_OPTIONS = `${FOR_ATTRIBUTE}-options`;
export const FOR_OPTIMISTIC = 'optimistic';
export const FOR_WRAPPER_RERENDER = 'rerender';

// data-if
export const IF_ATTRIBUTE = 'data-if';
export const IF_TRUE_CONDITION_SLOT_NAME = 'true';
export const IF_FALSE_CONDITION_SLOT_NAME = 'false';

// skin.css
export const ID_DEFAULT_SKIN_CSS = 'webc-skin-default-stylesheet';
export const ID_CUSTOM_SKIN_CSS = 'webc-skin-custom-stylesheet';

// others
export const LOG_LEVEL: {
  [key: string]: LogLevel;
} = {
  NONE: 'none',
  WARN: 'warn',
  ERROR: 'error',
};

export const HOOK_TYPE: {
  [key: string]: HookType;
} = {
  BEFORE_PAGE: 'beforePageLoads',
  AFTER_PAGE: 'afterPageLoads',
  CLOSED_PAGE: 'whenPageClose'
};
