"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const lavaclient_1 = require("lavaclient");
const QueueStore_1 = require("./QueueStore");
class QueueClient extends lavaclient_1.Node {
    constructor({ options, sendGatewayPayload, connection }) {
        super({ ...options, sendGatewayPayload, connection });
        this.queues = new QueueStore_1.QueueStore(this, options.redis instanceof ioredis_1.default ? options.redis : new ioredis_1.default(options.redis));
    }
}
exports.QueueClient = QueueClient;
//# sourceMappingURL=QueueClient.js.map