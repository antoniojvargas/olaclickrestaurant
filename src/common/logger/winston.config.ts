import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import { join } from 'path';

export const winstonConfig = {
  transports: [
    // 📜 Log en consola
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        nestWinstonModuleUtilities.format.nestLike('OlaClick', {
          colors: true,
          prettyPrint: true,
        }),
      ),
    }),

    // 💾 Log en archivo
    new winston.transports.File({
      filename: join(process.cwd(), 'logs', 'app.log'),
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
};
