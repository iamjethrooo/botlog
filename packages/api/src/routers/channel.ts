import { t } from "../trpc";
import { z } from "zod";
import { APIGuildChannel, APIGuildTextChannel, ChannelType } from "discord-api-types/v10";
import { getFetch } from "@trpc/client";

const fetch = getFetch();

export const channelRouter = t.router({
  getAll: t.procedure
    .input(
      z.object({
        guildId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { guildId } = input;

      const token = process.env.DISCORD_TOKEN;

      // call the discord api with the token and the guildId and get all the guild's text channels
      const response = await fetch(
        `https://discordapp.com/api/guilds/${guildId}/channels`,
        {
          headers: {
            Authorization: `Bot ${token}`,
          },
        }
      );
      const responseChannels: APIGuildChannel<ChannelType>[] = <APIGuildChannel<ChannelType>[]>(
        await response.json()
      );

      const channels: APIGuildTextChannel<ChannelType.GuildText>[] = responseChannels.filter(
        //(channel) => channel.type === 0
        (channel): channel is APIGuildTextChannel<ChannelType.GuildText> => {
          return channel.type === ChannelType.GuildText;
        }
      );
      return { channels };
    }),
});
