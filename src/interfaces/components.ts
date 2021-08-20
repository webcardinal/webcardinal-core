export type WebcAppError = {
  message: string;
  url?: string;
  lineNo?: number;
  columnNo?: number;
  error?: Error;
  isScriptError?: boolean;
}

export type WebcAppLoaderType = 'default' | 'iframe' | 'object' | 'parser' | 'none';

export type WebcAppMenuMode = 'horizontal' | 'mobile' | 'vertical';
