import { CommandInteraction, GuildMember, MessageEmbed } from "discord.js";
import { trpcNode } from "../../../trpc";

export class CoinFlipGame {
  public async coinFlip(
    interaction: CommandInteraction,
    playerMap: Map<string, GuildMember>,
    bet: Number,
    prediction: String
  ) {
    const player1 = <GuildMember>interaction.member;
    let player2: GuildMember;
    playerMap.forEach((player) => {
      if (player.id !== player1.id) player2 = player;
    });

    await game(player1, player2!, bet);

    async function game(
      player1: GuildMember,
      player2: GuildMember,
      bet: Number
    ) {
      let heads = Math.random() < 0.5;
      console.log(heads);
      const embed = new MessageEmbed().setTitle("Coin Flip");
      let winner;
      let loser;
      if (prediction == "heads") {
        if (heads) {
          winner = player1;
          loser = player2;
        } else {
          winner = player2;
          loser = player1;
        }
      } else {
        if (heads) {
          winner = player2;
          loser = player1;
        } else {
          winner = player1;
          loser = player2;
        }
      }

      await trpcNode.user.addCash.mutate({
        id: winner.user.id,
        cash: Number(bet),
      });

      await trpcNode.user.subtractCash.mutate({
        id: loser.user.id,
        cash: Number(bet),
      });
      let betString = `${process.env.COIN_EMOJI}${bet}`;
      embed
        .setAuthor(
          `${interaction.user.username}#${interaction.user.discriminator}`,
          interaction.user.displayAvatarURL({ dynamic: true })
        )
        .setDescription(
          `Bet: ${betString}\n\n**<@${
            prediction == "heads" ? player1.user.id : player2.user.id
          }> bet on:** heads\n**<@${
            prediction == "heads" ? player2.user.id : player1.user.id
          }> bet on:** tails\n\nThe coin landed on: **${
            heads ? "heads" : "tails"
          }**\n\n<@${winner.user.id}> won!\n\n<@${
            winner.user.id
          }> gained ${betString}\n<@${loser.user.id}> lost ${betString}`
        )
        .setColor(player1.displayHexColor);
      return await interaction.channel?.send({
        embeds: [embed],
      });
    }
  }

  // });
  // }
}
