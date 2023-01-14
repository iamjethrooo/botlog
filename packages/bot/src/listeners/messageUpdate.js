"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageUpdateListener = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
let MessageUpdateListener = class MessageUpdateListener extends framework_1.Listener {
    async run(message) {
        if (message.author.bot)
            return;
        const { client } = framework_1.container;
        client.editsnipes.set(message.channel.id, message);
    }
};
MessageUpdateListener = __decorate([
    (0, decorators_1.ApplyOptions)({
        event: 'messageUpdate'
    })
], MessageUpdateListener);
exports.MessageUpdateListener = MessageUpdateListener;
//# sourceMappingURL=messageUpdate.js.map