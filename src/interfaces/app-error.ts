export interface AppError {
    message: string,
    url?: string, 
    lineNo?: number, 
    columnNo?: number, 
    error?: Error,
    isScriptError?: boolean
}