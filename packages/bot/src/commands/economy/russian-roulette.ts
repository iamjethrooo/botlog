import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Args,
  Command,
  CommandOptions,
  container,
} from "@sapphire/framework";
import { CommandInteraction, EmbedBuilder, Message } from "discord.js";
import { trpcNode } from "../../trpc";

function getRouletteMessage(playerId: String, isWin: boolean) {
  const winMessages = [
    `<@${playerId}> pulls the trigger... *click*! Lucky shot, <@${playerId}>!`,
    `<@${playerId}> pulls the trigger... *click*! Phew, that was a close one!`,
    `<@${playerId}> pulls the trigger... *click*! Nice reflexes, <@${playerId}>!`,
    `<@${playerId}> pulls the trigger... *click*! Looks like you're a survivor, <@${playerId}>!`,
    `<@${playerId}> pulls the trigger... *click*! Wow, that was a nail-biter, but you made it, <@${playerId}>!`,
  ];
  const loseMessages = [
    `<@${playerId}> pulls the trigger... *bang*! Oh no, <@${playerId}>... better luck next time.`,
    `<@${playerId}> pulls the trigger... *bang*! Sadly, <@${playerId}> didn't make it this time.`,
    `<@${playerId}> pulls the trigger... *bang*! It looks like luck wasn't on <@${playerId}>'s side.`,
    `<@${playerId}> pulls the trigger... *bang*! Better luck next time, <@${playerId}>... if there is one.`,
    `<@${playerId}> pulls the trigger... *bang*! The odds weren't in <@${playerId}>'s favor this time.`,
  ];
  return isWin
    ? winMessages[Math.floor(Math.random() * winMessages.length)]
    : loseMessages[Math.floor(Math.random() * loseMessages.length)];
}

@ApplyOptions<CommandOptions>({
  name: "russian-roulette",
  aliases: ["rr", "russianroulette"],
  description: "Start a game of Russian Roulette!",
  preconditions: ["inBotChannel", "isNotInmate"],
})
export class RussianRouletteCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {}

  public override async messageRun(message: Message, args: Args) {
    const { client } = container;
    let argument = await args.pick("string").catch(() => "");
    let argumentIsNumber = false;
    let bet = 0;
    try {
      bet = Number(argument);
      argumentIsNumber = bet ? true : false;
    } catch (error) {
      console.log(error);
    }

    let user = await trpcNode.user.getUserById.query({
      id: message.author.id,
    });

    const embed = new EmbedBuilder().setAuthor({
      name: `${message.author.username}#${message.author.discriminator}`,
      iconURL: message.author.displayAvatarURL(),
    });

    const minBet = Number(process.env.RR_MIN_BET);
    const maxBet = Number(process.env.RR_MAX_BET);
    const MAX_MEMBERS = Number(process.env.RR_MAX_PLAYERS);

    const noGameOngoing = !client.intervals["rr"];
    if (noGameOngoing && argumentIsNumber) {
      if (bet) {
      }
      // Start waiting
      if (bet < minBet) {
        embed
          .setDescription(`❌ The bet must be more than \`${minBet}\``)
          .setColor(`#${process.env.RED_COLOR}`)
          .setFooter(null);
        await message.channel.send({ embeds: [embed] });
        return;
      } else if (bet > maxBet) {
        embed
          .setDescription(`❌ The bet must be less than \`${maxBet}\``)
          .setColor(`#${process.env.RED_COLOR}`)
          .setFooter(null);
        await message.channel.send({ embeds: [embed] });
        return;
      }

      let insufficientFunds = user!.user!.cash < bet;
      if (insufficientFunds) {
        embed.setDescription(`❌ You do not have enough money for the bet!`);
        embed.setColor(`#${process.env.RED_COLOR}`);
        await message.channel.send({ embeds: [embed] });
        return;
      }
      // Start game
      embed
        .setDescription(
          `A Russian Roulette game is starting!\n\nTo start the game, use the command \`bbc rr start\`.\nTo join the game, use the command \`bbc rr join\`.`
        )
        .setAuthor({
          name: `${message.author.username}#${message.author.discriminator}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setColor(message.member!.displayHexColor)
        .setFooter({ text: "Time remaining: 3 minutes or 6 members" });
      await message.channel.send({ embeds: [embed] });

      // Set variables
      client.rrBet = bet;
      client.rrPlayers.push(message.member!.id);
      client.rrIsOngoing = true;
      client.timestamps["rr"] = Date.now().toString();
      client.intervals["rr"] = setInterval(async () => {
        if (client.rrIsOngoing) {
          client.rrIsOngoing =
            (Date.now() - Number(client.timestamps["rr"])) / 1000 <
            Number(process.env.RR_WAITING_TIME);
          return;
        }
        if (client.rrPlayers.length < 2) {
          embed
            .setDescription(
              `Sorry, the minimum number of players required to start a Russian roulette game is \`two\`. Please invite more players to join the game.`
            )
            .setAuthor(null)
            .setColor(`#${process.env.RED_COLOR}`)
            .setFooter(null);
          await message.channel.send({ embeds: [embed] });
          clearInterval(client.intervals["rr"]);
          delete client.intervals["rr"];

          // Reset variables
          client.rrBet = 0;
          client.rrPlayers = [];
          return;
        }
        embed
          .setDescription(`The Russian Roulette game is starting!`)
          .setAuthor(null)
          .setColor(message.guild!.members.me!.displayHexColor)
          .setFooter(null);
        await message.channel.send({ embeds: [embed] });
        clearInterval(client.intervals["rr"]);
        delete client.intervals["rr"];

        let currentPlayerIndex = 0;
        let shot = false;
        let roulette = setInterval(async () => {
          let currentPlayerId = client.rrPlayers[currentPlayerIndex];
          shot = Math.random() <= 1 / client.rrPlayers.length;
          if (shot || currentPlayerIndex >= client.rrPlayers.length - 1) {
            clearInterval(roulette);
            embed
              .setAuthor(null)
              .setDescription(getRouletteMessage(currentPlayerId, false))
              .setColor(null)
              .setFooter(null);
            await message.channel.send({ embeds: [embed] });

            const winnings = Math.round(
              Number(client.rrBet) / (client.rrPlayers.length - 1)
            );

            const losingPlayerId = client.rrPlayers[currentPlayerIndex];
            let splitMessage = "";
            for (const player of client.rrPlayers) {
              if (player == losingPlayerId) continue;
              splitMessage += `<@${player}> got ${process.env.COIN_EMOJI}${winnings}\n`;
              await trpcNode.user.addCash.mutate({
                id: String(player),
                cash: winnings,
              });
            }
            splitMessage += `\n<@${losingPlayerId}> lost ${process.env.COIN_EMOJI}${bet}`;

            await trpcNode.user.subtractCash.mutate({
              id: String(losingPlayerId),
              cash: bet,
            });

            // Announce winners
            embed
              .setAuthor(null)
              .setTitle(`Russian Roulette Results`)
              .setDescription(`${splitMessage}`)
              .setColor(null);
            await message.channel.send({ embeds: [embed] });

            // Reset variables
            client.rrBet = 0;
            client.rrPlayers = [];
          } else {
            embed
              .setAuthor(null)
              .setDescription(getRouletteMessage(currentPlayerId, true))
              .setColor(null)
              .setFooter(null);
            await message.channel.send({ embeds: [embed] });
            currentPlayerIndex++;
          }
        }, 1000);
      }, 1000);
    } else if (!noGameOngoing && argument.toLocaleLowerCase() == "join") {
      if (client.rrPlayers.includes(message.member!.id)) {
        embed
          .setAuthor({
            name: `${message.author.username}#${message.author.discriminator}`,
            iconURL: message.author.displayAvatarURL(),
          })
          .setDescription(`❌ You have already joined the game!`)
          .setColor(`#${process.env.RED_COLOR}`)
          .setFooter(null);
        await message.channel.send({ embeds: [embed] });
      } else {
        let insufficientFunds = user!.user!.cash < Number(client.rrBet);
        if (insufficientFunds) {
          embed.setDescription(`❌ You do not have enough money for the bet!`);
          embed.setColor(`#${process.env.RED_COLOR}`);
          await message.channel.send({ embeds: [embed] });
          return;
        }

        client.rrPlayers.push(message.member!.id);
        client.rrIsOngoing = client.rrPlayers.length < MAX_MEMBERS;
        embed
          .setAuthor({
            name: `${message.author.username}#${message.author.discriminator}`,
            iconURL: message.author.displayAvatarURL(),
          })
          .setDescription(`✅ You joined the game.`)
          .setColor(`#${process.env.GREEN_COLOR}`)
          .setFooter(null);
        await message.channel.send({ embeds: [embed] });
      }
    } else if (!noGameOngoing && argument.toLocaleLowerCase() == "start") {
      // Check if user is initiator
      if (message.member!.id == client.rrPlayers[0]) {
        client.rrIsOngoing = false;
      } else {
        embed
          .setAuthor({
            name: `${message.author.username}#${message.author.discriminator}`,
            iconURL: message.author.displayAvatarURL(),
          })
          .setDescription(
            `❌ Only <@${client.rrPlayers[0]}> can start the game before 3 minutes is up.`
          )
          .setColor(`#${process.env.RED_COLOR}`)
          .setFooter(null);
        await message.channel.send({ embeds: [embed] });
      }
    }
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
