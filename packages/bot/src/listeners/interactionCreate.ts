import { ApplyOptions } from "@sapphire/decorators";
import { Listener, ListenerOptions } from "@sapphire/framework";
import { EmbedBuilder, type ButtonInteraction } from "discord.js";
import { trpcNode } from "../trpc";
import { PaginatedFieldMessageEmbed } from "@sapphire/discord.js-utilities";
@ApplyOptions<ListenerOptions>({
  event: "interactionCreate",
})
export class InteractionCreateListener extends Listener {
  public override async run(interaction: ButtonInteraction) {
    //console.log(interaction);
    const customId = interaction.customId.split("-")[0];
    const action = interaction.customId.split("-")[1];
    const userId = interaction.member?.user.id!;

    const giveaway = await trpcNode.giveaway.getById.mutate({
      giveawayId: customId,
    });

    let participants = await trpcNode.giveaway.getParticipants.mutate({
      giveawayId: customId,
    });

    let entries = await trpcNode.giveaway.getEntries.mutate({
      giveawayId: customId,
    });

    if (action === "Join") {
      let entryCount = entries.filter(
        (i) => i.userId == interaction.user.id
      ).length;

      if (entryCount < giveaway?.numOfEntries!) {
        // Check for balance
        let participant = await trpcNode.user.getUserById.query({
          id: interaction.user.id,
        });
        let entryFee = Number(giveaway!.entryFee);
        let insufficientFunds = participant!.user!.cash < entryFee;

        if (insufficientFunds) {
          await interaction.reply({
            content: ":x: You don't have enough money for this giveaway.",
            ephemeral: true,
          });
        } else {
          await trpcNode.user.subtractCash.mutate({
            id: userId,
            cash: entryFee,
          });
          // Add entry to giveaway
          await trpcNode.giveaway.addEntry.mutate({
            giveawayId: customId,
            userId: userId,
          });
          await interaction.reply({
            content: "✅ You joined the giveaway.",
            ephemeral: true,
          });
        }
      } else {
        await interaction.reply({
          content:
            ":x: You have already reached the maximum amount of entries.",
          ephemeral: true,
        });
      }
    } else if (action === "Participants") {
      let participantsFormatted: String[] = [];
      let index = 1;

      //   participantsFormatted.push(
      //     `These are the members that have participated in the giveaway of **${
      //       giveaway!.prize
      //     }**:`
      //   );
      if (participants.length == 0) {
        participantsFormatted.push("No one has joined the giveaway yet. :(");
      } else {
        participants.forEach((participant) => {
          const entries_ = entries.filter(
            (i) => i.userId == participant.userId
          ).length;
          participantsFormatted.push(
            `${index}. <@${participant.userId}> (**${entries_}** ${
              entries_ > 1 ? "entries" : "entry"
            })`
          );
          index++;
        });
      }

      const baseEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setAuthor({
          name: `${giveaway?.prize} Giveaway`,
          iconURL: interaction!.guild!.iconURL()!,
        })
        .setFooter({
          text: `Total Participants: ${participants.length}`,
        });

      new PaginatedFieldMessageEmbed()
        .setTitleField("Participants")
        .setTemplate(baseEmbed)
        .setItems(participantsFormatted)
        .setItemsPerPage(20)
        .make()
        .run(interaction);

      return;
    }

    return;
  }
}
