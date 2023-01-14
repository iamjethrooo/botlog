"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserInDB = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const logger_1 = __importDefault(require("../lib/utils/logger"));
const trpc_1 = require("../trpc");
let UserInDB = class UserInDB extends framework_1.Precondition {
    async chatInputRun(interaction) {
        const guildMember = interaction.member;
        try {
            const user = await trpc_1.trpcNode.user.create.mutate({
                id: guildMember.id,
                name: guildMember.user.username
            });
            if (!user)
                throw new Error();
        }
        catch (error) {
            logger_1.default.error(error);
            return this.error({ message: 'Something went wrong!' });
        }
        return this.ok();
    }
};
UserInDB = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'userInDB'
    })
], UserInDB);
exports.UserInDB = UserInDB;
//# sourceMappingURL=UserInDB.js.map