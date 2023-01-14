"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.t = void 0;
const server_1 = require("@trpc/server");
const superjson_1 = __importDefault(require("superjson"));
exports.t = server_1.initTRPC.context().create({
    transformer: superjson_1.default
});
//# sourceMappingURL=trpc.js.map