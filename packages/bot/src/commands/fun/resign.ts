import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import { CommandInteraction, Message, AttachmentBuilder } from "discord.js";

@ApplyOptions<CommandOptions>({
  name: "resign",
  description: "This is your sign to resign.",
})
export class ResignCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {
    const imagePath = 'src/images/resignation.png';
    const attachment = new AttachmentBuilder(imagePath);
    
    return await interaction.reply({ content: `<@${interaction.member?.user.id}>, This is your sign to resign.`, files: [attachment] });
  }

  public override async messageRun(message: Message) {
    const imagePath = 'src/images/resignation.png';
    const attachment = new AttachmentBuilder(imagePath);
    
    return await message.reply({ content: `<@${message.author.id}>, This is your sign to resign.`, files: [attachment] });
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
