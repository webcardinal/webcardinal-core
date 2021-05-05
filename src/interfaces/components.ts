export type WebcAppError = {
  message: string;
  url?: string;
  lineNo?: number;
  columnNo?: number;
  error?: Error;
  isScriptError?: boolean;
}

export type WebcAppLoaderType = 'default' | 'iframe' | 'object' | 'parser';

export type WebcAppMenuMode = 'horizontal' | 'mobile' | 'vertical';
