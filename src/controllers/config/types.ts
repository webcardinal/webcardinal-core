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
  indexed?: boolean;
  children?: Page[];
  skin?: Skin;
};

export type LogLevel = 'none' | 'warn' | 'error';

export type DocsSource = 'github' | 'local';
