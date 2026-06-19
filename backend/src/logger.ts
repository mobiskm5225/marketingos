const levels = ['error', 'warn', 'info', 'debug'] as const;

function write(level: string, obj: object | string, msg?: string) {
  const entry = typeof obj === 'string'
    ? { level, time: new Date().toISOString(), msg: obj }
    : { level, time: new Date().toISOString(), ...obj, msg };
  console.log(JSON.stringify(entry));
}

const log = {
  info: (obj: object | string, msg?: string) => write('info', obj, msg),
  warn: (obj: object | string, msg?: string) => write('warn', obj, msg),
  error: (obj: object | string, msg?: string) => write('error', obj, msg),
  debug: (obj: object | string, msg?: string) => write('debug', obj, msg),
};

export default log;
