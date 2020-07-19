const { Command } = require('discord.js-commando');
const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');
const { open_weather_api } = require('../../config.json');

module.exports = class WeatherCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'weather',
			group: 'misc',
			memberName: 'weather',
			description: 'Know the weather!'
		});
	}

	run(message, args) {
		const zipCode = args.split(' ')[0];
		const randomColor = "#000000".replace(/0/g, function () { return (~~(Math.random() * 16)).toString(16); });

		fetch(`http://api.openweathermap.org/data/2.5/weather?zip=${zipCode},ph&units=metric&appid=${open_weather_api}`)
			.then(response => response.json())
			.then(json => {
				let embed;

		        const weathermoji = {
		          "Clouds": "⛅️",
		          "Rain": "☔️",
		          "Haze": "🌫",
		          "Thunderstorm": "⛈",
		          "Sunny": "☀️",
		          "Mist": "🌫",
		          "Clear": "☀️"
		        }

				if (json.cod === '404') {
					embed = new MessageEmbed()
						.setTitle(`⚠️ Error`)
						.setColor(randomColor)
						.setDescription(`This zip code does not exist or there is no information available.`)
						.setTimestamp();
				}
				else {
					const currentWeather = json.weather[0].main;
					embed = new MessageEmbed()
						.setTitle(`${json.name}, ${json.sys.country}`)
						.setColor(randomColor)
						.addField(`${weathermoji[currentWeather]} Forecast:`, `${currentWeather}, ${json.weather[0].description}`)
						.addField(`🌡️ Current:`, `${json.main.temp} °C`)
						.addField(`🥵 High:`, `${json.main.temp_max} °C`)
						.addField(`🥶 Low:`, `${json.main.temp_min} °C`)
						.setTimestamp();
				}

				message.say(embed);
			});
	}
}