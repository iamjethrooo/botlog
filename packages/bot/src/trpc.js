"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trpcNode = void 0;
const client_1 = require("@trpc/client");
const httpLink_1 = require("@trpc/client/links/httpLink");
const splitLink_1 = require("@trpc/client/links/splitLink");
const wsLink_1 = require("@trpc/client/links/wsLink");
const superjson_1 = __importDefault(require("superjson"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const ws_1 = __importDefault(require("ws"));
const globalAny = global;
globalAny.fetch = node_fetch_1.default;
globalAny.WebSocket = ws_1.default;
const wsClient = (0, wsLink_1.createWSClient)({
    url: `ws://localhost:2022`
});
exports.trpcNode = (0, client_1.createTRPCProxyClient)({
    transformer: superjson_1.default,
    links: [
        (0, splitLink_1.splitLink)({
            condition(op) {
                return op.type === 'subscription';
            },
            true: (0, wsLink_1.wsLink)({
                client: wsClient
            }),
            false: (0, httpLink_1.httpLink)({
                url: 'http://localhost:3000/api/trpc'
            })
        })
    ]
});
//# sourceMappingURL=trpc.js.map