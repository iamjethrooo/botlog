"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trpc = void 0;
const client_1 = require("@trpc/client");
const next_1 = require("@trpc/next");
const superjson_1 = __importDefault(require("superjson"));
exports.trpc = (0, next_1.createTRPCNext)({
    config({ ctx }) {
        if (typeof window !== 'undefined') {
            // during client requests
            return {
                transformer: superjson_1.default,
                links: [
                    (0, client_1.httpBatchLink)({
                        url: '/api/trpc'
                    })
                ]
            };
        }
        // The server needs to know your app's full url
        const url = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}/api/trpc`
            : 'http://localhost:3000/api/trpc';
        return {
            transformer: superjson_1.default,
            links: [
                (0, client_1.httpBatchLink)({
                    url,
                    /**
                     * Set custom request headers on every request from tRPC
                     * @link https://trpc.io/docs/v10/header
                     */
                    headers() {
                        if (ctx === null || ctx === void 0 ? void 0 : ctx.req) {
                            // To use SSR properly, you need to forward the client's headers to the server
                            // This is so you can pass through things like cookies when we're server-side rendering
                            // If you're using Node 18, omit the "connection" header
                            const { 
                            // eslint-disable-next-line @typescript-eslint/no-unused-vars
                            connection: _connection, ...headers } = ctx.req.headers;
                            return {
                                ...headers
                                // Optional: inform server that it's an SSR request
                                //"x-ssr": "1",
                            };
                        }
                        return {};
                    }
                })
            ]
        };
    },
    ssr: false
});
//# sourceMappingURL=trpc.js.map