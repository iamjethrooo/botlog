"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandDeniedListener = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
let CommandDeniedListener = class CommandDeniedListener extends framework_1.Listener {
    async run({ context, message: content }, { interaction }) {
        return await interaction.reply({
            ephemeral: true,
            content: content
        });
    }
};
CommandDeniedListener = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'chatInputCommandDenied'
    })
], CommandDeniedListener);
exports.CommandDeniedListener = CommandDeniedListener;
//# sourceMappingURL=commandDenied.js.map