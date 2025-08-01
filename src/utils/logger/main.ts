import { createLogger, transports } from "winston";
import { createFileTransports, globalFormat } from ".";

const mainLogger = createLogger({
  format: globalFormat,
  transports: [
    ...createFileTransports("main", ["info"]),
    new transports.Console({ level: "info" }),
  ],
});

export default mainLogger;
