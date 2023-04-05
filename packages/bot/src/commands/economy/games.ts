import { GameInvite } from "../../lib/utils/games/inviteEmbed";
import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import {
  GuildMember,
  EmbedBuilder,
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
} from "discord.js";
import { CoinFlipGame } from "../../lib/utils/games/coinflip";
import { trpcNode } from "../../trpc";

export const playersInGame: Map<string, GuildMember> = new Map();
@ApplyOptions<CommandOptions>({
  name: "games",
  description: "Play a game with another person",
  preconditions: ["isCommandDisabled", "inBotChannel", "isNotInmate"],
})
export class GamesCommand extends Command {
  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    let canPlay = !(
      (<GuildMember>interaction.member)!.roles.cache.has(
        "742226368213024839"
      ) ||
      (<GuildMember>interaction.member)!.roles.cache.has(
        "742226368091389983"
      ) ||
      (<GuildMember>interaction.member)!.roles.cache.has(
        "889470124422201364"
      ) ||
      (<GuildMember>interaction.member)!.roles.cache.has("1079460013308919830")
    );

    if (!canPlay) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${interaction.user.username}#${interaction.user.discriminator}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setDescription(
          `❌ Your level is not high enough to use this command. Required level is 15.`
        );
      embed.setColor(`#${process.env.RED_COLOR}`);

      return await interaction.reply({ embeds: [embed] });
    }
    let user = await trpcNode.user.getUserById.query({
      id: interaction.user.id,
    });
    let lastGameDate = Number(user.user!.lastCoinFlipDate);
    let gameCooldown = Number(process.env.COINFLIP_COOLDOWN);

    let tooSoon = (Date.now() - lastGameDate) / 1000 < gameCooldown;
    console.log(tooSoon);
    if (tooSoon) {
      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${interaction.user.username}#${interaction.user.discriminator}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setDescription(
          `⏲️ Too soon. You can start another game in <t:${
            Math.round(lastGameDate / 1000) + gameCooldown
          }:R>`
        );
      embed.setColor(`#${process.env.RED_COLOR}`);

      return await interaction.reply({ embeds: [embed] });
    }

    let maxPlayers = 2;
    const playerMap = new Map();
    const player1 = <GuildMember>interaction.member;
    const bet = interaction.options.getNumber("bet", true);
    if (bet < 0) {
      return await interaction.reply({
        content: ":x: Bet must not be less than 0!",
        ephemeral: true,
      });
    } else if (bet > 200) {
      return await interaction.reply({
        content: ":x: Bet must be less than or equal to 200!",
        ephemeral: true,
      });
    }
    let insufficientFunds = user!.user!.cash < bet;
    if (insufficientFunds) {
      return await interaction.reply({
        content: ":x: You don't have enough money for this bet.",
        ephemeral: true,
      });
    }

    const subCommand = interaction.options.getSubcommand();
    let gameTitle: string;

    if (playersInGame.has(player1.id)) {
      return await interaction.reply({
        content: ":x: You can't play more than 1 game at a time",
        ephemeral: true,
      });
    }
    playersInGame.set(player1.id, player1);
    playerMap.set(player1.id, player1);
    if (subCommand == "coinflip") {
      gameTitle = "Coin Flip";
      const tempEmbed = new EmbedBuilder()
        .setTitle("Coin Flip")
        .setAuthor({
          name: `${interaction.user.username}#${interaction.user.discriminator}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setDescription(
          `<@${
            interaction.user.id
          }> bet that the coin would land **${interaction.options.get(
            "prediction",
            true
          )}**.`
        )
        .setColor((<GuildMember>interaction.member)!.displayHexColor);
      await interaction.channel
        ?.send({
          embeds: [tempEmbed],
        })
        .then((embed) => {
          console.log(embed);
          setTimeout(() => {
            embed.delete();
          }, 6000);
        });
    } else {
      gameTitle = "";
    }

    const invite = new GameInvite(gameTitle!, [player1], interaction, bet);
    
    await interaction
      .reply({
        embeds: [invite.gameInviteEmbed()],
        components: [invite.gameInviteButtons()],
      })
      .then(async (i) => {
        const inviteCollector =
          interaction.channel?.createMessageComponentCollector({
            time: 60 * 1000,
          });
        inviteCollector?.on("collect", async (response) => {
          if (response.customId === `${interaction.id}${player1.id}-Join`) {
            if (response.user.id === player1.id) {
              await interaction.followUp({
                content: ":x: You started the invite.",
                ephemeral: true,
              });
            } else if (playersInGame.has(response.user.id)) {
              if (response.user.id !== player1.id) {
                await interaction.followUp({
                  content: `:x: You are already playing a game.`,
                  ephemeral: true,
                });
              }
            }

            if (!playerMap.has(response.user.id)) {
              let canPlay = !(
                (<GuildMember>response.member)!.roles.cache.has(
                  "742226368213024839"
                ) ||
                (<GuildMember>response.member)!.roles.cache.has(
                  "742226368091389983"
                ) ||
                (<GuildMember>response.member)!.roles.cache.has(
                  "889470124422201364"
                ) ||
                (<GuildMember>response.member)!.roles.cache.has(
                  "1079460013308919830"
                )
              );
              if (!canPlay) {
                const embed = new EmbedBuilder()
                  .setAuthor({
                    name: `${(<GuildMember>response.member).user.username}#${
                      (<GuildMember>response.member).user.discriminator
                    }`,
                    iconURL: (<GuildMember>(
                      response.member
                    )).user.displayAvatarURL(),
                  })
                  .setDescription(
                    `❌ Your level is not high enough to use this command. Required level is 15.`
                  );
                embed.setColor(`#${process.env.RED_COLOR}`);

                await response.reply({ embeds: [embed] });
                return;
              }
              // Check for balance
              let player = await trpcNode.user.getUserById.query({
                id: response.user.id,
              });
              let lastGameDate = Number(player.user!.lastCoinFlipDate);
              let tooSoon = (Date.now() - lastGameDate) / 1000 < gameCooldown;
              if (tooSoon) {
                const embed = new EmbedBuilder()
                  .setAuthor({
                    name: `${(<GuildMember>response.member).user.username}#${
                      (<GuildMember>response.member).user.discriminator
                    }`,
                    iconURL: (<GuildMember>(
                      response.member
                    )).user.displayAvatarURL(),
                  })
                  .setDescription(
                    `⏲️ Too soon. You can join another game in <t:${
                      Math.round(lastGameDate / 1000) + gameCooldown
                    }:R>`
                  );
                embed.setColor(`#${process.env.RED_COLOR}`);

                await response.reply({ embeds: [embed] });
                return;
              }
              insufficientFunds = player!.user!.cash < bet;
              if (insufficientFunds) {
                await response.reply({
                  content: ":x: You don't have enough money for this bet.",
                  ephemeral: true,
                  // target: <GuildMember>response.member,
                });
              } else {
                playerMap.set(response.user.id, <GuildMember>response.member);
              }
            }
            if (playerMap.size == maxPlayers) {
              return inviteCollector.stop("start-game");
            }
          }
          const accepted: GuildMember[] = [];
          playerMap.forEach((player) => accepted.push(player));
        });
        inviteCollector?.on("end", async (collected, reason) => {
          await interaction.deleteReply()!;
          if (playerMap.size === 1 || reason === "declined") {
            playerMap.forEach((player) => playersInGame.delete(player.id));
          }
          if (reason === "time") {
            await interaction.followUp({
              content: `:x: No one responded to your invitation.`,
              ephemeral: true,
              target: player1,
            });
            if (playerMap.size > 1) {
              playerMap.forEach((player: GuildMember) =>
                playersInGame.set(player.id, player)
              );
              return startGame(subCommand);
            }
          }
          if (reason === "start-game") {
            return startGame(subCommand);
          }
        });
        function startGame(subCommand: string) {
          switch (subCommand) {
            case "coinflip":
              const prediction = interaction.options.getString(
                "prediction",
                true
              );
              new CoinFlipGame()
                .coinFlip(interaction, playerMap, bet, prediction)
                .then(() => {
                  playerMap.forEach(async (player) => {
                    playersInGame.delete(player.id);
                  });
                });
              break;
          }
        }
      });
    return;
  }

  public override registerApplicationCommands(
    registry: ApplicationCommandRegistry
  ): void {
    registry.registerChatInputCommand({
      name: this.name,
      description: this.description,
      options: [
        {
          type: ApplicationCommandOptionType.Subcommand,
          name: "coinflip",
          description: "Play a game of Coin Flip with another Person.",
          options: [
            {
              type: ApplicationCommandOptionType.Integer,
              required: true,
              name: "bet",
              description: "How much do you want to bet?",
            },
            {
              type: ApplicationCommandOptionType.String,
              required: true,
              name: "prediction",
              description: "Which side do you think the coin would land with?",
              choices: [
                {
                  name: "Heads",
                  value: "heads",
                },
                {
                  name: "Tails",
                  value: "tails",
                },
              ],
            },
          ],
        },
      ],
    });
  }
}
