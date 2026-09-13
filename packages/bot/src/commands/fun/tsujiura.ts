import { ApplyOptions } from '@sapphire/decorators';
import {
    ApplicationCommandRegistry,
    Command,
    CommandOptions
} from '@sapphire/framework';
import { AttachmentBuilder, CommandInteraction, Message, TextChannel } from 'discord.js';
import fetch from "node-fetch";
import sharp from "sharp";
import { parse } from "node-html-parser";

const url = "http://www.fortunecookiemessage.com";

async function getFortune(message: Message) {
    try {
        const resp = await fetch(url);
        const html = await resp.text();
        const root = parse(html);

        const fortune = root.querySelector("#fortuneText")?.text.trim();
        if (!fortune) throw new Error("No fortune found");

        const hanzi = root.querySelector("#hanzi")?.text.trim() ?? "";
        const meaning = root.querySelector("#meaning")?.text.trim() ?? "";
        const numbers = root.querySelector("#numbers")?.text.trim() ?? "";

        const formatted = [
            hanzi && meaning ? `${hanzi}: ${meaning}` : null,
            numbers ? `Lucky numbers: ${numbers}` : null,
        ].filter(Boolean).join("\n");

        const imgPng = await fortuneProcess(fortune);
        const attachment = new AttachmentBuilder(imgPng, { name: `cookie_${message.author.id}.png` });
        await (message.channel as TextChannel).send({ content: "Your fortune is:", files: [attachment] });

        if (formatted) await (message.channel as TextChannel).send(formatted);
    } catch (err) {
        console.error("Error fetching fortune:", err);
    }
}

function escapeSvg(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

const imagePath = 'src/images/cookie.png';

async function fortuneProcess(fortune: string): Promise<Buffer> {
    const words = fortune.split(" ");
    const line1 = words.slice(0, 5).join(" ");
    const line2 = words.slice(5, 10).join(" ");
    const line3 = words.slice(10).join(" ");

    const textSvg = `
    <svg width="400" height="80" xmlns="http://www.w3.org/2000/svg">
      <style>
        .fortune { fill: black; font-size: 15px; font-family: 'FortuneCookieNF', sans-serif; }
      </style>
      <text x="220" y="20" text-anchor="middle" class="fortune">${escapeSvg(line1)}</text>
      <text x="220" y="40" text-anchor="middle" class="fortune">${escapeSvg(line2)}</text>
      <text x="220" y="60" text-anchor="middle" class="fortune">${escapeSvg(line3)}</text>
    </svg>
  `;

    return await sharp(imagePath)
        .composite([{ input: Buffer.from(textSvg), top: 160, left: 0 }])
        .png()
        .toBuffer();
}

@ApplyOptions<CommandOptions>({
    name: 'tsujiura',
    aliases: ['senbei'],
    description: 'Retrieves a random fortune cookie.'
})
export class TsujiuraCommand extends Command {


    public override async chatInputRun(interaction: CommandInteraction) {
    }

    public override async messageRun(message: Message) {
        return await getFortune(message);
    }

    public override registerApplicationCommands(
        registery: ApplicationCommandRegistry
    ): void {
        registery.registerChatInputCommand({
            name: this.name,
            description: this.description
        });
    }
}
