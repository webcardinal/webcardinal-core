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
export const DEFAULT_CONTROLLER_KEY = 'default-controller';
export const HYDRATED = 'hydrated';
export const MODEL_CHAIN_PREFIX = '@';
export const TRANSLATION_CHAIN_PREFIX = '$';
export const SKIP_BINDING_FOR_PROPERTIES = ['_saveElement'];
export const SKIP_BINDING_FOR_COMPONENTS = ['webc-template', 'webc-container', 'webc-component', 'webc-datatable'];
export const PSK_CARDINAL_PREFIX = 'psk-';

// data-tag
export const TAG_ATTRIBUTE = 'data-tag';
export const TAG_MODEL_FUNCTION_PROPERTY = 'getDataTagModel';

// data-for
export const FOR_ATTRIBUTE = 'data-for';
export const FOR_NO_DATA_SLOT_NAME = 'no-data';
export const FOR_LOADIBNG_SLOT_NAME = 'loading';
export const FOR_OPTIONS = `${FOR_ATTRIBUTE}-options`;
export const FOR_EVENTS = 'events';
export const FOR_OPTIMISTIC = 'optimistic';
export const FOR_WRAPPER_RERENDER = 'rerender';
export const FOR_CONTENT_UPDATED_EVENT = 'content-updated';
export const FOR_CONTENT_REPLACED_EVENT = 'content-replaced';
export const FOR_TEMPLATE_SIZE = 'data-for-template-size';

// data-if
export const IF_ATTRIBUTE = 'data-if';
export const IF_TRUE_CONDITION_SLOT_NAME = 'true';
export const IF_FALSE_CONDITION_SLOT_NAME = 'false';
export const IF_LOADIBNG_SLOT_NAME = 'loading';

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
  BEFORE_APP: 'beforeAppLoads',
  AFTER_APP: 'afterAppLoads',
  BEFORE_PAGE: 'beforePageLoads',
  AFTER_PAGE: 'afterPageLoads',
  CLOSED_PAGE: 'whenPageClose',
};

// custom properties
export const CP_WEBC_APP_ROOT_MODE = '--mode';
export const CP_WEBC_APP_ROOT_MOBILE_BREAKPOINT = '--mode-mobile-breakpoint';
