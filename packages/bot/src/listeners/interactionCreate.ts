import { ApplyOptions } from "@sapphire/decorators";
import { Listener, ListenerOptions } from "@sapphire/framework";
import { EmbedBuilder, type Interaction } from "discord.js";
import { trpcNode } from "../trpc";
import { PaginatedFieldMessageEmbed } from "@sapphire/discord.js-utilities";
@ApplyOptions<ListenerOptions>({
  event: "interactionCreate",
})
export class InteractionCreateListener extends Listener {
  public override async run(interaction: Interaction) {
    if (!interaction.isButton() || !interaction.inGuild()) return;
    const route = /^(\d{17,20})-(Join|Participants)$/.exec(
      interaction.customId
    );
    if (!route) return;
    const [, customId, action] = route;
    const userId = interaction.user.id;

    try {
      if (action === "Join") {
        // Discord accepts one acknowledgement per interaction. Do this before
        // payment: duplicate deliveries that cannot defer never enter the API.
        await interaction.deferReply({ ephemeral: true });
        const result = await trpcNode.giveaway.addEntry.mutate({
          giveawayId: customId,
          userId,
        });
        const responses = {
          joined: "✅ You joined the giveaway.",
          missing: ":x: Giveaway not found.",
          ended: ":x: This giveaway has ended.",
          cap: ":x: You have already reached the maximum amount of entries.",
          funds: ":x: You don't have enough money for this giveaway.",
        };
        await interaction.editReply({ content: responses[result.status] });
      } else if (action === "Participants") {
        await interaction.deferReply({ ephemeral: true });
        const giveaway = await trpcNode.giveaway.getById.mutate({ giveawayId: customId });
        if (!giveaway) {
          await interaction.editReply({ content: ":x: Giveaway not found." });
          return;
        }
        const entries = await trpcNode.giveaway.getEntries.mutate({ giveawayId: customId });
        const participants = await trpcNode.giveaway.getParticipants.mutate({
          giveawayId: customId,
        });
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

        await new PaginatedFieldMessageEmbed()
          .setTitleField("Participants")
          .setTemplate(baseEmbed)
          .setItems(participantsFormatted)
          .setItemsPerPage(20)
          .make()
          .run(interaction);

        return;
      }
    } catch (error) {
      console.error("Giveaway interaction failed", error);
      // Never retry an unknown financial outcome automatically.
      try {
        const response = {
          content:
            ":x: Could not complete the giveaway request. Check your entries and balance before retrying.",
          ephemeral: true,
        };
        if (interaction.deferred && !interaction.replied)
          await interaction.editReply({ content: response.content });
        else if (interaction.replied) await interaction.followUp(response);
        else await interaction.reply(response);
      } catch (responseError) {
        console.error("Giveaway error response failed", responseError);
      }
    }
    return;
  }
}
