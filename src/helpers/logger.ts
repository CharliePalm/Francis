enum LogLevel {
  'Error',
  'Info',
  'Debug',
}
const levelMap = new Map([
  [LogLevel.Error, 'ERROR'],
  [LogLevel.Info, 'INFO'],
  [LogLevel.Debug, 'DEBUG'],
]);

const CURRENT_LOG_LEVEL = LogLevel.Error;
export class Logger {
  static _log(level: LogLevel, message: string, params?: any) {
    CURRENT_LOG_LEVEL >= level &&
      console.log(`[${levelMap.get(level)}]: ${message}\n`, params ?? '');
  }
  static info(message: string, params?: any) {
    Logger._log(LogLevel.Info, message, params);
  }
  static error(message: string, params?: any) {
    Logger._log(LogLevel.Error, message, params);
  }
  static debug(message: string, params?: any) {
    Logger._log(LogLevel.Debug, message, params);
  }
}
