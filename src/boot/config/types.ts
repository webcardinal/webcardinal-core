export type Identity = {
  name: string;
  email: string;
  avatar: string;
};

export type Skin = {
  name: string;
  translations?: boolean;
};

export type Page = {
  name: string;
  path?: string;
  src?: string;
  tag?: string;
  loader?: string;
  indexed?: boolean;
  children?: Page[];
};

export type FallbackPage = {
  name: string;
  src?: string;
  tag?: string;
  loader?: string;
}

export type HookType = 'beforeAppLoads' | 'afterAppLoads' | 'beforePageLoads' | 'afterPageLoads' | 'whenPageClose';

export type LogLevel = 'none' | 'warn' | 'error';

export type DocsSource = 'github' | 'local';
