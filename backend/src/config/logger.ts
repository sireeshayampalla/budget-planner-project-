export const logger = {
  info: (message: string, ...meta: any[]) => {
    const metaString = meta.length ? ` | ${meta.map(m => typeof m === 'object' ? JSON.stringify(m) : m).join(' ')}` : '';
    console.log(`[INFO] ${message}${metaString}`);
  },
  error: (message: string, error?: any, ...meta: any[]) => {
    const errorDetails = error ? ` | ${error.stack || error.message || JSON.stringify(error)}` : '';
    const metaString = meta.length ? ` | ${meta.map(m => typeof m === 'object' ? JSON.stringify(m) : m).join(' ')}` : '';
    console.error(`[ERROR] ${message}${errorDetails}${metaString}`);
  },
  warn: (message: string, ...meta: any[]) => {
    const metaString = meta.length ? ` | ${meta.map(m => typeof m === 'object' ? JSON.stringify(m) : m).join(' ')}` : '';
    console.warn(`[WARN] ${message}${metaString}`);
  },
  success: (message: string, ...meta: any[]) => {
    const metaString = meta.length ? ` | ${meta.map(m => typeof m === 'object' ? JSON.stringify(m) : m).join(' ')}` : '';
    console.log(`[SUCCESS] ${message}${metaString}`);
  },
  debug: (message: string, ...meta: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      const metaString = meta.length ? ` | ${meta.map(m => typeof m === 'object' ? JSON.stringify(m) : m).join(' ')}` : '';
      console.log(`[DEBUG] ${message}${metaString}`);
    }
  }
};
