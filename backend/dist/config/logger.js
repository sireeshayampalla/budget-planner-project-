export const logger = {
    info: (message, ...meta) => {
        const metaString = meta.length ? ` | ${meta.map(m => typeof m === 'object' ? JSON.stringify(m) : m).join(' ')}` : '';
        console.log(`[INFO] ${message}${metaString}`);
    },
    error: (message, error, ...meta) => {
        const errorDetails = error ? ` | ${error.stack || error.message || JSON.stringify(error)}` : '';
        const metaString = meta.length ? ` | ${meta.map(m => typeof m === 'object' ? JSON.stringify(m) : m).join(' ')}` : '';
        console.error(`[ERROR] ${message}${errorDetails}${metaString}`);
    },
    warn: (message, ...meta) => {
        const metaString = meta.length ? ` | ${meta.map(m => typeof m === 'object' ? JSON.stringify(m) : m).join(' ')}` : '';
        console.warn(`[WARN] ${message}${metaString}`);
    },
    success: (message, ...meta) => {
        const metaString = meta.length ? ` | ${meta.map(m => typeof m === 'object' ? JSON.stringify(m) : m).join(' ')}` : '';
        console.log(`[SUCCESS] ${message}${metaString}`);
    },
    debug: (message, ...meta) => {
        if (process.env.NODE_ENV !== 'production') {
            const metaString = meta.length ? ` | ${meta.map(m => typeof m === 'object' ? JSON.stringify(m) : m).join(' ')}` : '';
            console.log(`[DEBUG] ${message}${metaString}`);
        }
    }
};
