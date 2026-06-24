import { ApplyOptions } from '@sapphire/decorators';
import {
    ApplicationCommandRegistry,
    Command,
    CommandOptions,
    Args
} from '@sapphire/framework';
import { CommandInteraction, Message, TextChannel } from 'discord.js';
const signs = [
    "aries",
    "taurus",
    "gemini",
    "cancer",
    "leo",
    "virgo",
    "libra",
    "scorpio",
    "sagittarius",
    "capricorn",
    "aquarius",
    "pisces",
];

const chinese_signs = [
    "ox",
    "goat",
    "rat",
    "snake",
    "dragon",
    "tiger",
    "rabbit",
    "horse",
    "monkey",
    "rooster",
    "dog",
    "pig",
]

const horo_styles = {
    "love": "https://www.horoscope.com/us/horoscopes/love/horoscope-love-daily-today.aspx?sign=",
    "daily": "https://www.horoscope.com/us/horoscopes/general/horoscope-general-daily-today.aspx?sign=",
    "chinese": "http://www.horoscope.com/us/horoscopes/chinese/horoscope-chinese-daily-today.aspx?sign=",
}

const regex: RegExp[] = [
    /<\/strong> - ([^`]*?)\n/,
    /\w+\s\d+,\s\d+/,
]

function box(content: string): string {
    return `\`\`\`\n${content}\n\`\`\``;
}

function isValidStyle(style: string): boolean {
    return style in horo_styles;
}

function getZodiacSign(month: number, day: number): number {
    const times: boolean[] = [
        (month === 12 && day >= 22) || (month === 1 && day <= 19), // Capricorn
        (month === 1 && day >= 20) || (month === 2 && day <= 17),  // Aquarius
        (month === 2 && day >= 18) || (month === 3 && day <= 19),  // Pisces
        (month === 3 && day >= 20) || (month === 4 && day <= 19),  // Aries
        (month === 4 && day >= 20) || (month === 5 && day <= 20),  // Taurus
        (month === 5 && day >= 21) || (month === 6 && day <= 20),  // Gemini
        (month === 6 && day >= 21) || (month === 7 && day <= 22),  // Cancer
        (month === 7 && day >= 23) || (month === 8 && day <= 22),  // Leo
        (month === 8 && day >= 23) || (month === 9 && day <= 22),  // Virgo
        (month === 9 && day >= 23) || (month === 10 && day <= 22), // Libra
        (month === 10 && day >= 23) || (month === 11 && day <= 21),// Scorpio
        (month === 11 && day >= 22) || (month === 12 && day <= 21) // Sagittarius
    ];

    for (let i = 0; i < times.length; i++) {
        if (times[i]) {
            return i; // returns index 0–11
        }
    }
    return -1; // if no match
}

function capitalizeFirst(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// function getChineseSign(year: number): string {
//     const czodiac: [number, string][] = [
//         [1900, "Rat"],
//         [1901, "Ox"],
//         [1902, "Tiger"],
//         [1903, "Rabbit"],
//         [1904, "Dragon"],
//         [1905, "Snake"],
//         [1906, "Horse"],
//         [1907, "Sheep"],
//         [1908, "Monkey"],
//         [1909, "Rooster"],
//         [1910, "Dog"],
//         [1911, "Pig"]
//     ];

//     const index = (year - czodiac[0][0]) % 12;
//     return czodiac[index][1];
// }

@ApplyOptions<CommandOptions>({
    name: 'horo',
    aliases: ['horoscope'],
    description: 'Get your daily horoscope'
})
export class HoroCommand extends Command {


    public override async chatInputRun(interaction: CommandInteraction) {
    }

    public override async messageRun(message: Message, args: Args) {
        let sign = await args.rest('string');
        let horos = sign.split(", ")
        let style = horos[0]
        horos.shift()
        sign = horos[0].toLowerCase()
        if (style == "chinese") {
            if (chinese_signs.indexOf(sign) == -1) {
                return await (message.channel as TextChannel).send(`The sign is not valid. Use: ${chinese_signs.join(", ")}`);
            }
            let uri = horo_styles[style]
            let signNum = chinese_signs.indexOf(sign) + 1
            let uir = uri + signNum

            const resp = await fetch(uir);
            const text = await resp.text();

            const msgMatch = text.match(regex[0]);
            const dateMatch = text.match(regex[1]);

            if (!msgMatch || !dateMatch) {
                return await (message.channel as TextChannel).send("An error occurred while fetching the horoscope. Please try again later.");
            }

            let msg = msgMatch[0];
            const date = dateMatch[0];

            const msgContent = msg.replace("</p>", "").replace("</strong> - ", "");
            msg = `${msgContent} - ${date}`;

            return await (message.channel as TextChannel).send(`Today's Chinese horoscope for the one born in the year of the ${capitalizeFirst(sign)} is:\n${box(msg)}`);
        }
        else {
            if (!isValidStyle(style)) {
                style = 'daily';
            }
            if (signs.indexOf(sign) == -1) {
                let month = sign.split("/")[0];
                let day = sign.split("/")[1];
                sign = signs[getZodiacSign(parseInt(month), parseInt(day))];
            }

            let uri = horo_styles[style]
            let signNum = signs.indexOf(sign) + 1
            let uir = uri + signNum

            const resp = await fetch(uir);
            const text = await resp.text();

            const msgMatch = text.match(regex[0]);
            const dateMatch = text.match(regex[1]);

            if (!msgMatch || !dateMatch) {
                return await (message.channel as TextChannel).send("An error occurred while fetching the horoscope. Please try again later.");
            }

            let msg = msgMatch[0];
            const date = dateMatch[0];

            const msgContent = msg.replace("</p>", "").replace("</strong> - ", "");
            msg = `${msgContent} - ${date}`;

            if (style == "love") {
                return await (message.channel as TextChannel).send(`Today's love horoscope for ${capitalizeFirst(sign)} is:\n${box(msg)}`);
            } else {
                return await (message.channel as TextChannel).send(`Today's horoscope for ${capitalizeFirst(sign)} is:\n${box(msg)}`);
            }
        }
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
