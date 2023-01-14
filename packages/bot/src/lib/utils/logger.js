"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
require("winston-daily-rotate-file");
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};
const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'warn';
};
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white'
};
winston_1.default.addColors(colors);
const format = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'MM-DD-YYYY HH:mm:ss' }), 
// winston.format.colorize({ level: true }),
winston_1.default.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`));
const transports = [
    new winston_1.default.transports.Console(),
    new winston_1.default.transports.DailyRotateFile({
        dirname: './logs',
        filename: 'Master-Bot-%DATE%.log',
        datePattern: 'MM-DD-YYYY',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d'
    })
];
const Logger = winston_1.default.createLogger({
    level: level(),
    levels,
    format,
    transports
});
exports.default = Logger;
//# sourceMappingURL=logger.js.map