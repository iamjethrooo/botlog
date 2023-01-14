import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import type { CommandInteraction, Message } from "discord.js";

@ApplyOptions<CommandOptions>({
  name: "bing",
  description: "BING CHILLING",
})
export class PingCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    return await interaction.reply(
      `[Spoken]
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
Zài jiàn`
);
  }

  public override async messageRun(message: Message) {
    return await message.reply(
      `[Spoken]
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
Zài jiàn`
);
  }

  public override registerApplicationCommands(
    registery: ApplicationCommandRegistry
  ): void {
    registery.registerChatInputCommand({
      name: this.name,
      description: this.description,
    });
  }
}
