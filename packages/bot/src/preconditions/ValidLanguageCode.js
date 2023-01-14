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
exports.ValidLanguageCode = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const iso_639_1_1 = __importDefault(require("iso-639-1"));
let ValidLanguageCode = class ValidLanguageCode extends framework_1.Precondition {
    chatInputRun(interaction) {
        const targetLang = interaction.options.getString('target', true);
        const languageCode = iso_639_1_1.default.getCode(targetLang);
        if (!languageCode) {
            return this.error({ message: ':x: Please enter a valid language!' });
        }
        return this.ok();
    }
};
ValidLanguageCode = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'validateLanguageCode'
    })
], ValidLanguageCode);
exports.ValidLanguageCode = ValidLanguageCode;
//# sourceMappingURL=ValidLanguageCode.js.map