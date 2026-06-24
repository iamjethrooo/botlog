import { ApplyOptions } from '@sapphire/decorators';
import {
    ApplicationCommandRegistry,
    Command,
    CommandOptions
} from '@sapphire/framework';
import { AttachmentBuilder, CommandInteraction, Message, TextChannel } from 'discord.js';
import fetch from "node-fetch";
import * as iconv from "iconv-lite";
import sharp from "sharp";
import { parse } from "node-html-parser";

const regex: RegExp[] = [
    /class="cookie-link">([^`]*?)<\/a>/,
    /<p>([^`]*?)<\/p>/,
    /(?:\\\\['])/,
    /<strong>([^`]*?)<\/strong>/,
    /<\/strong><\/a>([^`]*?)<br>/,
    /3\)<\/strong><\/a>([^`]*?)<\/div>/,
]

const url = "http://www.fortunecookiemessage.com";

async function getFortune(message: Message) {
    try {
        const resp = await fetch(url, { headers: { encoding: "utf-8" } });
        const buffer = await resp.arrayBuffer();
        const test = iconv.decode(Buffer.from(buffer), "ISO-8859-1");

        let fortuneMatches = test.match(regex[0]);
        if (!fortuneMatches) throw new Error("No fortune found");

        let fortune = fortuneMatches[0];
        const fortest = /^<p>/.exec(fortune);
        if (fortest) {
            const inner = fortune.match(regex[1]);
            if (inner) fortune = inner[0];
        }
        const root = parse(test);

        const anchors = root.querySelectorAll("div.bottom-message a");
        const sections = anchors.map(anchor => {
            const label = anchor.text.trim();
            const siblingText = anchor.nextSibling?.text?.trim() ?? "";
            const value = siblingText.replace(/^:/, "").trim();
            return { label, value };
        });

        const formatted = sections.map(s => `${s.label}: ${s.value}`).join("\n");

        fortune = fortune.replace('class="cookie-link">', '');
        fortune = fortune.replace("</a>", "");
        fortune = fortune.replace("<p>", "").replace("</p>", "");

        const imgPng = await fortuneProcess(fortune);
        const attachment = new AttachmentBuilder(imgPng, { name: `cookie_${message.author.id}.png` });
        await (message.channel as TextChannel).send({ content: "Your fortune is:", files: [attachment] });

          await (message.channel as TextChannel).send(formatted);
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
