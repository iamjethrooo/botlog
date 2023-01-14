"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const framework_1 = require("@sapphire/framework");
const trpc_1 = require("../../../trpc");
const logger_1 = __importDefault(require("../logger"));
const handleReminders_1 = require("./handleReminders");
const reminderEmbed_1 = require("./reminderEmbed");
const RemindersPubSub_1 = __importDefault(require("./RemindersPubSub"));
const ReminderStore_1 = __importDefault(require("./ReminderStore"));
const Reminders = new ReminderStore_1.default();
function ReminderEvents() {
    RemindersPubSub_1.default.subscribe(`__keyevent@${process.env.REDIS_DB || 0}__:expired`);
    RemindersPubSub_1.default.on('message', async (channel, message) => {
        const [type, user, key, value] = message.split('.');
        switch (type) {
            case 'reminders': {
                if (value != 'trigger')
                    return;
                const discordUser = await framework_1.container.client.users.fetch(user);
                const cache = await Reminders.get(`reminders.${user}.${key}`);
                const reminder = cache
                    ? await JSON.parse(cache)
                    : (await trpc_1.trpcNode.reminder.getReminder.mutate({
                        userId: user,
                        event: key
                    })).reminder;
                if (!reminder)
                    return;
                const remind = new reminderEmbed_1.RemindEmbed(reminder.userId, reminder.timeOffset, reminder.event, reminder.dateTime, reminder.description, reminder.repeat);
                await (0, handleReminders_1.removeReminder)(reminder.userId, reminder.event, false);
                try {
                    await discordUser.send({
                        embeds: [remind.RemindEmbed()]
                    });
                }
                catch (error) {
                    logger_1.default.info("A Reminder message failed, the intended users DM's are likely disabled.");
                    logger_1.default.debug(error);
                    return; // don't recreate entry if the users DMs is disabled
                }
                if (reminder.repeat) {
                    const nextAlarm = (0, handleReminders_1.nextReminder)(reminder.timeOffset, reminder.repeat, reminder.dateTime);
                    await (0, handleReminders_1.saveReminder)(reminder.userId, {
                        userId: reminder.userId,
                        timeOffset: reminder.timeOffset,
                        event: reminder.event,
                        dateTime: (0, handleReminders_1.convertInputsToISO)(reminder.timeOffset, nextAlarm.time, nextAlarm.date),
                        description: reminder.description,
                        repeat: reminder.repeat
                    });
                }
                break;
            } // end of Reminder Type
        }
        return;
    });
}
exports.default = ReminderEvents;
//# sourceMappingURL=ReminderEvents.js.map