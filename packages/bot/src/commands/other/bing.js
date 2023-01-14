"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PingCommand = void 0;
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
let PingCommand = class PingCommand extends framework_1.Command {
    async chatInputRun(interaction) {
        return await interaction.reply(`[Spoken]
Zǎo shang hǎo zhōng guó!
Xiàn zài wǒ yǒu bing chilling
Wǒ hěn xǐ huān bing chilling
Dàn shì "sù dù yǔ jī qíng jiǔ" bǐ bing chilling
"sù dù yǔ jī qíng, sù dù yǔ jī qíng jiǔ"
Wǒ zuì xǐ huān
Suǒ yǐ xiàn zài shì yīn yuè shí jiān
Zhǔn bèi
Yī, èr, sān
[Break]
Liǎng gè lǐ bài yǐ hòu
"Sù dù yǔ jī qíng jiǔ"
Liǎng gè lǐ bài yǐ hòu
"Sù dù yǔ jī qíng jiǔ"
Liǎng gè lǐ bài yǐ hòu
"Sù dù yǔ jī qíng jiǔ"

[Spoken]
Bù yào wàng jì, bù yào cuò guò
Jì dé qù diàn yǐng yuàn kàn "sù dù yǔ jī qíng jiǔ"
Yīn wéi fēi cháng hǎo diàn yǐng
Dòng zuò fēi cháng hǎo
Chà bù duō yī yàng bing chilling
Zài jiàn`);
    }
    async messageRun(message) {
        return await message.reply(`[Spoken]
Zǎo shang hǎo zhōng guó!
Xiàn zài wǒ yǒu bing chilling
Wǒ hěn xǐ huān bing chilling
Dàn shì "sù dù yǔ jī qíng jiǔ" bǐ bing chilling
"sù dù yǔ jī qíng, sù dù yǔ jī qíng jiǔ"
Wǒ zuì xǐ huān
Suǒ yǐ xiàn zài shì yīn yuè shí jiān
Zhǔn bèi
Yī, èr, sān
[Break]
Liǎng gè lǐ bài yǐ hòu
"Sù dù yǔ jī qíng jiǔ"
Liǎng gè lǐ bài yǐ hòu
"Sù dù yǔ jī qíng jiǔ"
Liǎng gè lǐ bài yǐ hòu
"Sù dù yǔ jī qíng jiǔ"

[Spoken]
Bù yào wàng jì, bù yào cuò guò
Jì dé qù diàn yǐng yuàn kàn "sù dù yǔ jī qíng jiǔ"
Yīn wéi fēi cháng hǎo diàn yǐng
Dòng zuò fēi cháng hǎo
Chà bù duō yī yàng bing chilling
Zài jiàn`);
    }
    registerApplicationCommands(registery) {
        registery.registerChatInputCommand({
            name: this.name,
            description: this.description,
        });
    }
};
PingCommand = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: "bing",
        description: "BING CHILLING",
    })
], PingCommand);
exports.PingCommand = PingCommand;
//# sourceMappingURL=bing.js.map