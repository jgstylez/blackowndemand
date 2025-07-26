
export interface ErrorLogEntry {
  timestamp: string;
  message: string;
  level: 'error' | 'warning' | 'info';
  context?: string;
  metadata?: Record<string, any>;
  userAgent?: string;
  url?: string;
}

class ErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private maxLogs = 100;

  log(
    message: string,
    level: 'error' | 'warning' | 'info' = 'error',
    context?: string,
    metadata?: Record<string, any>
  ): void {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      message,
      level,
      context,
      metadata,
      userAgent: navigator?.userAgent,
      url: window?.location?.href,
    };

    this.logs.unshift(entry);
    
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    console.error(`[${level.toUpperCase()}] ${context || 'Unknown'}: ${message}`, metadata);

    if (level === 'error') {
      this.sendToSupabase(entry);
    }
  }

  private async sendToSupabase(entry: ErrorLogEntry): Promise<void> {
    try {
      // In a real implementation, this would send to Supabase
      console.log('Would send to Supabase:', entry);
    } catch (error) {
      console.error('Failed to send error to Supabase:', error);
    }
  }

  getLogs(): ErrorLogEntry[] {
    return [...this.logs];
  }

  getLogsForLevel(level: 'error' | 'warning' | 'info'): ErrorLogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  clearLogs(): void {
    this.logs = [];
  }

  getLogsForContext(context: string): ErrorLogEntry[] {
    return this.logs.filter(log => log.context === context);
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

const errorLogger = new ErrorLogger();

export const logError = (
  message: string,
  options?: {
    level?: 'error' | 'warning' | 'info';
    context?: string;
    metadata?: Record<string, any>;
  }
) => {
  errorLogger.log(
    message,
    options?.level || 'error',
    options?.context,
    options?.metadata
  );
};

export const getErrorLogs = () => errorLogger.getLogs();
export const clearErrorLogs = () => errorLogger.clearLogs();
export const exportErrorLogs = () => errorLogger.exportLogs();

export default errorLogger;
