import { LOG_LEVEL } from '../../../constants';
import type { AppError, LogLevel } from '../../../interfaces';

export function subscribeToErrors() {
  window.onerror = function (msg, url, lineNo, columnNo, error) {
    const string = typeof msg === 'string' ? msg.toLowerCase() : '';
    const substring = 'script error';
    let appError: AppError;
    if (string.indexOf(substring) > -1) {
      appError = {
        message: 'script error',
        isScriptError: true,
      };
    } else {
      appError = {
        message: typeof msg === 'string' ? msg : JSON.stringify(msg),
        url,
        lineNo,
        columnNo,
        error,
      };
    }

    window.dispatchEvent(new CustomEvent('webcAppError', { detail: appError }));

    return false;
  };
}

export function subscribeToWarnings() {
  const originalWarn = console.warn;
  console.warn = function (...args) {
    window.dispatchEvent(new CustomEvent('webcAppWarning', { detail: args }));
    return originalWarn.apply(console, args);
  };
}

export function subscribeToLogs(logLevel: LogLevel | string) {
  const { ERROR, WARN } = LOG_LEVEL;

  switch (logLevel) {
    case ERROR: {
      subscribeToErrors();
      return;
    }
    case WARN: {
      subscribeToErrors();
      subscribeToWarnings();
      return;
    }
  }
}
