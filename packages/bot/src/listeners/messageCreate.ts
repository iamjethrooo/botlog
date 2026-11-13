// @ts-nocheck
import { setTimeout } from '../lib/lifecycle';
import { ApplyOptions } from "@sapphire/decorators";
import { Listener, ListenerOptions, container } from "@sapphire/framework";
import { Message, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { trpcNode } from "../trpc";

const picsOnlyChannels = [
  "669514957938753558", // artworks
  "800543054221541376", // mixtape
  "669514986548232193", // snaps
  "671669574961201157", // cosplays
  "801677818760003594", // pics-only
  "978228788561346571",
  "1044996825754644670", // shorts
];

const noCashChannels = [
  "682838969179832423",
  "1064926572680847490",
  "794833126270566411",
  "794833143113973760",
  "738754900992721028",
  "993892178893996032",
  "796684897594769418",
  "670801689770590208",
  // "674518870211559428", // Botlog
  "674860915383992340",
  "725110364773154896",
  "1071650269416402965",
];

@ApplyOptions<ListenerOptions>({
  event: "messageCreate",
})
export class MessageListener extends Listener {
  private readonly awarding = new Map<string, Promise<void>>();
  public override async run(message: Message): Promise<void> {
    if (message.guild === null) return;

    const { client } = container;
    const isBot = message.author.bot;
    if (isBot) return;

    // No cache: each eligible message reads one fresh, bounded settings batch.
    // Serialize this user's award checks, preserving even a configured zero cooldown.
    if (!noCashChannels.includes(message.channel.id) && message.member) {
      const previous =
        this.awarding.get(message.author.id) ?? Promise.resolve();
      let release!: () => void;
      const current = new Promise<void>((resolve) => {
        release = resolve;
      });
      this.awarding.set(message.author.id, current);
      await previous;
      try {
        const rows = await trpcNode.setting.getByKeys.query({
          keys: [
            "startingCash",
            "minCashPerChat",
            "maxCashPerChat",
            "interval",
            "roleIdInmate",
          ],
        });
        const settings = Object.fromEntries(
          rows.map((row) => [row.settingKey, row.settingValue])
        );
        const startingCash = Number(settings.startingCash);
        const minCashPerChat = Number(settings.minCashPerChat);
        const maxCashPerChat = Number(settings.maxCashPerChat);
        const interval = Number(settings.interval);
        if (
          !settings.roleIdInmate ||
          ["startingCash", "minCashPerChat", "maxCashPerChat", "interval"].some(
            (key) => !settings[key]?.trim()
          ) ||
          ![startingCash, minCashPerChat, maxCashPerChat, interval].every(
            Number.isFinite
          ) ||
          minCashPerChat > maxCashPerChat ||
          interval < 0
        ) {
          throw new Error(
            "Missing or invalid message award settings; skipping award."
          );
        }

        if (!message.member.roles.cache.has(settings.roleIdInmate)) {
          await trpcNode.user.claimMessageReward.mutate({
            messageId: message.id,
            userId: message.author.id,
            name: message.author.username,
          });
        }
      } catch (error) {
        // Do not retry ambiguous money writes or use stale/default award settings.
        console.error("Message award failed", error);
      } finally {
        release();
        if (this.awarding.get(message.author.id) === current) {
          this.awarding.delete(message.author.id);
        }
      }
    }

    // Removes text messages in media-only channels.
    try {
      if (
        picsOnlyChannels.includes(message.channel.id) &&
        message.member &&
        !message.member.permissions.has(PermissionFlagsBits.Administrator) &&
        message.attachments.size === 0 &&
        message.embeds.length === 0
      ) {
        const discussionChannel =
          client.channels.cache.get("735804432985620521");
        if (!discussionChannel || !("send" in discussionChannel)) {
          throw new Error("Media discussion channel unavailable");
        }
        const content = message.content.replace(
          /@(everyone|here)/g,
          "@\u200b$1"
        );
        const embed = new EmbedBuilder()
          .setAuthor({
            name: message.author.username,
            iconURL: message.author.displayAvatarURL(),
          })
          .addFields(
            (content.match(/[\s\S]{1,1024}/g) || ["(empty message)"]).map(
              (value, index) => ({
                name:
                  index === 0
                    ? "Message content:"
                    : "Message content (continued):",
                value,
              })
            )
          )
          .setTimestamp(message.createdAt)
          .setColor(message.member.displayHexColor)
          .setFooter({ text: "#".concat(message.channel.name) });
        if (message.reference) {
          embed.addFields({
            name: "Replied to:",
            value: `[Click to jump to message.](https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.reference.messageId})`,
          });
        }
        await message.delete();
        const notice = await message.channel.send(
          "Don't chat here, please use the <#735804432985620521> channel above."
        );
        setTimeout(() => {
          notice
            .delete()
            .catch((error) =>
              console.error("Media notice cleanup failed", error)
            );
        }, 5000);
        await discussionChannel.send(`<@${message.author.id}>`);
        await discussionChannel.send({ embeds: [embed] });
        return;
      }
    } catch (error) {
      console.error("Media moderation failed", error);
    }

    // Linger
    const content = normalize(message.content);
    const matchedKey = Object.keys(LINGER_CHAIN).find((key) =>
      content.includes(normalize(key))
    );

    if (matchedKey) {
      const response = LINGER_CHAIN[matchedKey];

      try {
        await message.channel.send(response);
      } catch (error) {
        console.error("Linger reply failed", error);
      }
    }
  }
}

const LINGER_CHAIN: Record<string, string> = {
  "im lingering": `🎶 BUT I'M IN SO DEEEEEP...`,

  "but im in so deep": `😔 YOU KNOW I'M SUCH A FOOL FOR YOU`,

  "you know im such a fool for you": `🫵YOU GOT ME WRAPPED AROUND YOUR FINGER, OH-OH-OH`,

  "you got me wrapped around your finger": `💭DO YOU HAVE TO LET IT LINGER?`,

  "do you have to let it linger": `😭 bro is lingering...`,
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // remove punctuation
    .replace(/\s+/g, "") // collapse spaces
    .trim();
}
