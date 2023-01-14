"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorListeners = void 0;
const framework_1 = require("@sapphire/framework");
const logger_1 = __importDefault(require("../lib/utils/logger"));
function ErrorListeners() {
    const client = framework_1.container.client;
    /* Info:
        Winston adds "Error:" to the message so
      
          Logger.error('Command ' + err)
      
        will output "Command Error: ....." in the log
    */
    // Sapphire Client Errors
    client.on('chatInputCommandError', err => {
        logger_1.default.error('Command Chat Input ' + err);
    });
    client.on('contextMenuCommandError', err => {
        logger_1.default.error('Command Context Menu ' + err);
    });
    client.on('commandAutocompleteInteractionError', err => {
        logger_1.default.error('Command Autocomplete ' + err);
    });
    client.on('commandApplicationCommandRegistryError', err => {
        logger_1.default.error('Command Registry ' + err);
    });
    client.on('messageCommandError', err => {
        logger_1.default.error('Command ' + err);
    });
    client.on('interactionHandlerError', err => {
        logger_1.default.error('Interaction ' + err);
    });
    client.on('interactionHandlerParseError', err => {
        logger_1.default.error('Interaction Parse ' + err);
    });
    client.on('listenerError', err => {
        logger_1.default.error('Client Listener ' + err);
    });
    // LavaLink
    client.music.on('error', err => {
        logger_1.default.error('LavaLink ' + err);
    });
}
exports.ErrorListeners = ErrorListeners;
//# sourceMappingURL=ErrorHandling.js.map