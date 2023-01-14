"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trpcNode = void 0;
const client_1 = require("@trpc/client");
const superjson_1 = __importDefault(require("superjson"));
exports.trpcNode = (0, client_1.createTRPCProxyClient)({
    transformer: superjson_1.default,
    links: [
        (0, client_1.httpBatchLink)({
            url: 'http://localhost:3000/api/trpc'
        })
    ]
});
//# sourceMappingURL=trpc.js.map