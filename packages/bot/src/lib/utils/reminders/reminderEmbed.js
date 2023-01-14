"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemindEmbed = void 0;
const framework_1 = require("@sapphire/framework");
const discord_js_1 = require("discord.js");
const handleReminders_1 = require("./handleReminders");
class RemindEmbed {
    constructor(userId, timeOffset, event, dateTime, description, repeat) {
        this.userId = userId;
        this.timeOffset = timeOffset;
        this.event = event;
        this.dateTime = dateTime;
        this.description = description;
        this.repeat = repeat;
    }
    RemindEmbed() {
        const { client } = framework_1.container;
        const user = client.users.cache.get(this.userId);
        const baseEmbed = new discord_js_1.MessageEmbed()
            .setColor('YELLOW')
            .setTitle(`⏰ Reminder - ${this.event.charAt(0).toUpperCase() + this.event.slice(1).toLowerCase()}`)
            .setFooter({
            iconURL: user === null || user === void 0 ? void 0 : user.displayAvatarURL(),
            text: user === null || user === void 0 ? void 0 : user.username
        })
            .setTimestamp();
        if (this.repeat) {
            const nextAlarm = (0, handleReminders_1.nextReminder)(this.timeOffset, this.repeat, this.dateTime);
            baseEmbed.addFields([
                {
                    name: 'Next Alarm',
                    value: `> <t:${Math.floor(new Date((0, handleReminders_1.convertInputsToISO)(this.timeOffset, nextAlarm.time, nextAlarm.date)).valueOf() / 1000)}>`,
                    inline: true
                },
                { name: 'Repeated', value: `> ${this.repeat}`, inline: true }
            ]);
        }
        if (this.description)
            if (this.description.length > 0)
                baseEmbed.setDescription(`> ${this.description}`);
        return baseEmbed;
    }
}
exports.RemindEmbed = RemindEmbed;
//# sourceMappingURL=reminderEmbed.js.map