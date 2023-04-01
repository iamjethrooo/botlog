import { ApplyOptions } from "@sapphire/decorators";
import {
  ApplicationCommandRegistry,
  Args,
  Command,
  CommandOptions,
} from "@sapphire/framework";
import { CommandInteraction, Message, MessageEmbed } from "discord.js";

const fetch = require("node-fetch");

@ApplyOptions<CommandOptions>({
  name: "weather",
  description: "Know the weather!",
})
export class PingCommand extends Command {
  public override async chatInputRun(interaction: CommandInteraction) {}

  public override async messageRun(message: Message, args: Args) {
    console.log(args);
    const city = await args.rest("string").catch(() => "");
    if (city === "") return message.channel.send("Please provide a location.");
    const randomColor = "000000".replace(/0/g, function () {
      return (~~(Math.random() * 16)).toString(16);
    });

    fetch(
      `http://api.openweathermap.org/data/2.5/weather?q=${city},ph&units=metric&appid=${process.env.WEATHER_API}`
    )
      .then((response: any) => response.json())
      .then(async (json: any) => {
        let embed;

        const weathermoji: any = {
          Clouds: "⛅️",
          Rain: "☔️",
          Haze: "🌫",
          Thunderstorm: "⛈",
          Sunny: "☀️",
          Mist: "🌫",
          Clear: "☀️",
        };

        if (json.cod === "404") {
          embed = new MessageEmbed()
            .setTitle(`⚠️ Error`)
            .setColor(`#${randomColor}`)
            .setDescription(
              `This city does not exist or there is no information available.`
            )
            .setTimestamp();
        } else {
          const currentWeather: any= json.weather[0].main;
          embed = new MessageEmbed()
            .setTitle(`${json.name}, ${json.sys.country}`)
            .setColor(`#${randomColor}`)
            .setThumbnail(message!.guild!.iconURL()!)
            .addField(
              `${weathermoji[currentWeather]} Forecast:`,
              `${currentWeather}, ${json.weather[0].description}`
            )
            .addField(`🌡️ Current:`, `${json.main.temp} °C`, true)
            .addField(`🌡️ Feels Like:`, `${json.main.feels_like} °C`, true)
            //.addField('\u200B', '\u200B')
            .addField(`🌬️ Wind:`, `${json.wind.speed} km/h`, true)
            .addField(`🧭 Direction:`, `${json.wind.deg}°`, true)
            .addField(`💧 Humidity`, `${json.main.humidity}%`, true)
            .setTimestamp();
        }

        return await message.channel.send({ embeds: [embed] });
      });
      return;
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
