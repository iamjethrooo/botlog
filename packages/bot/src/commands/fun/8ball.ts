import { ApplyOptions } from '@sapphire/decorators';
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
  Args
} from '@sapphire/framework';
import { Message, ChatInputCommandInteraction, ApplicationCommandOptionType } from 'discord.js';
import * as fs from 'fs';

@ApplyOptions<CommandOptions>({
  name: '8ball',
  description: 'Get the answer to anything!',
})
export class EightBallCommand extends Command {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const question = interaction.options.getString('question', true);
    await interaction.deferReply();
    if (question.length > 255) {
      return await interaction.editReply('Please ask a shorter question!');
    }

    const possibleAnswers = fs.readFileSync(
      '././src/resources/other/8ball.json',
      'utf-8'
    );
    const answersArray: Array<string> = JSON.parse(possibleAnswers).answers;

    const randomAnswer =
      answersArray[Math.floor(Math.random() * answersArray.length)];

    // const answerEmbed = new EmbedBuilder()
    //   .setTitle(question)
    //   .setAuthor({
    //     name: 'Magic 8 Ball',
    //     iconURL: 'https://i.imgur.com/HbwMhWM.png'
    //   })
    //   .setDescription(randomAnswer)
    //   .setColor('#000000')
    //   .setTimestamp();
    //return await interaction.reply({ embeds: [answerEmbed] });
    return await interaction.editReply(`\`` + randomAnswer + `\``);
  }

  public override async messageRun(message: Message, args: Args) {
      const question = await args.rest('string');

      if (question.length > 255) {
        return await message.reply('Please ask a shorter question!');
      }

      const possibleAnswers = fs.readFileSync(
        '././src/resources/other/8ball.json',
        'utf-8'
      );
      const answersArray: Array<string> = JSON.parse(possibleAnswers).answers;

      const randomAnswer =
        answersArray[Math.floor(Math.random() * answersArray.length)];

      // const answerEmbed = new EmbedBuilder()
      //   .setTitle(question)
      //   .setAuthor({
      //     name: 'Magic 8 Ball',
      //     iconURL: 'https://i.imgur.com/HbwMhWM.png'
      //   })
      //   .setDescription(randomAnswer)
      //   .setColor('#000000')
      //   .setTimestamp();
      // return await message.reply({ embeds: [answerEmbed] });
      return await message.reply(`\`` + randomAnswer + `\``);
  }

  public override registerApplicationCommands(
    registery: ApplicationCommandRegistry
  ): void {
    registery.registerChatInputCommand({
      name: this.name,
      description: this.description,
      options: [
        {
          type: ApplicationCommandOptionType.String,
          required: true,
          name: 'question',
          description: 'What question do you want to ask the magic ball?'
        }
      ]
    });
  }
}
