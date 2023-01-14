"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.askForDateTime = exports.checkInputs = exports.nextReminder = exports.isPast = exports.convertInputsToISO = exports.checkReminders = exports.removeReminder = exports.saveReminder = void 0;
const discord_js_utilities_1 = require("@sapphire/discord.js-utilities");
const discord_js_1 = require("discord.js");
const time_utilities_1 = require("@sapphire/time-utilities");
const trpc_1 = require("../../../trpc");
const ReminderStore_1 = __importDefault(require("./ReminderStore"));
const logger_1 = __importDefault(require("../logger"));
const cache = new ReminderStore_1.default();
async function saveReminder(userId, reminder) {
    try {
        const entry = await trpc_1.trpcNode.reminder.getReminder.mutate({
            userId,
            event: reminder.event
        });
        if (!entry.reminder) {
            await trpc_1.trpcNode.reminder.create.mutate(reminder);
            await cache.setReminder(userId, reminder.event.replace(/\./g, ''), JSON.stringify(reminder), reminder.dateTime);
            return true;
        }
    }
    catch (error) {
        logger_1.default.error('saveReminder: ', error);
        return false;
    }
    return false;
}
exports.saveReminder = saveReminder;
async function removeReminder(userId, event, sendReply) {
    const key = `reminders.${userId}.${event.replace(/\./g, '')}`;
    const reminderExists = await cache.get(key);
    try {
        // Delete from Postgres
        await trpc_1.trpcNode.reminder.delete.mutate({
            userId: userId,
            event: event
        });
        // Delete from cache
        await cache.delete(`${key}.trigger`); // TTL
        await cache.delete(key); // data
    }
    catch (error) {
        logger_1.default.error('removeReminder: ', error);
        if (sendReply)
            return ':x: Something went wrong! Please try again later.';
    }
    if (reminderExists && sendReply)
        return `:wastebasket: Deleted reminder **${event}**.`;
    else if (sendReply)
        return `:x: **${event}** was not found.`;
    return ':x: Something went wrong! Please try again later.';
}
exports.removeReminder = removeReminder;
async function checkReminders() {
    try {
        const DB = await trpc_1.trpcNode.reminder.getAll.query();
        if (!DB.reminders || DB.reminders.length)
            return;
        DB.reminders.forEach(async (reminder) => {
            // Clean up Postgres incase trigger was missed
            if (isPast(reminder.dateTime)) {
                await removeReminder(reminder.userId, reminder.event, false);
                return;
            }
            // Store the DB entry to Cache
            await cache.setReminder(reminder.userId, reminder.event.replace(/\./g, ''), JSON.stringify(reminder), reminder.dateTime);
        });
    }
    catch (error) {
        logger_1.default.error('checkReminders: ', error);
        return;
    }
}
exports.checkReminders = checkReminders;
function convertInputsToISO(userOffset, timeQuery, date) {
    let isoStr = '';
    const [hour, minute] = timeQuery.split(':');
    timeQuery = `${padTo2Digits(hour)}:${padTo2Digits(minute)}`;
    const localDateTime = new Date();
    const DateEntry = date ? true : false;
    if (!date) {
        date = `${localDateTime.getMonth() + 1}/${localDateTime.getDate()}/${localDateTime.getFullYear()}`;
    }
    const [month, day, year] = date.split('/') || date.split('-');
    isoStr = `${year}-${padTo2Digits(month)}-${padTo2Digits(day)}T${timeQuery}:00.000Z`;
    const timeMS = new Date(isoStr).valueOf();
    const userOffset2Ms = userOffset * time_utilities_1.Time.Minute;
    isoStr = new Date(timeMS - userOffset2Ms).toISOString();
    if (isPast(isoStr) && !DateEntry) {
        isoStr = new Date(new Date(isoStr).valueOf() + time_utilities_1.Time.Day).toISOString();
    }
    return isoStr;
}
exports.convertInputsToISO = convertInputsToISO;
function isPast(dateTime) {
    return new Date(dateTime).valueOf() - Date.now() < 0 ? true : false;
}
exports.isPast = isPast;
async function findTimeZone(interaction, timeQuery, date) {
    if (await checkInputs(interaction, 'placeholder', timeQuery, date)) {
        const [hour, minute] = timeQuery.split(':');
        timeQuery = `${padTo2Digits(hour)}:${padTo2Digits(minute)}`;
        const [month, day, year] = date.split('/') || date.split('-');
        const userTime = `${year}-${padTo2Digits(month)}-${padTo2Digits(day)}T${timeQuery}:00.000Z`;
        const userTimeMS = new Date(userTime).valueOf();
        const rawOffset = userTimeMS - new Date().valueOf();
        const offset = Math.round(rawOffset / time_utilities_1.Time.Minute / 5) * 5;
        await trpc_1.trpcNode.user.updateTimeOffset.mutate({
            id: interaction.user.id,
            timeOffset: offset
        });
    }
}
function nextReminder(timeOffset, repeat, isoStr) {
    const offset2MS = timeOffset * time_utilities_1.Time.Minute;
    if (repeat === 'Daily') {
        isoStr = new Date(new Date(isoStr).valueOf() + time_utilities_1.Time.Day + offset2MS).toISOString();
    }
    if (repeat === 'Weekly') {
        isoStr = new Date(new Date(isoStr).valueOf() + time_utilities_1.Time.Day * 7 + offset2MS).toISOString();
    }
    isoStr = isoStr.replace(':00.000Z', '');
    const [DBDate, DBTime] = isoStr.split('T');
    const [DBHour, DBMinute] = DBTime.split(':');
    const [DBYear, DBMonth, DBDay] = DBDate.split('-');
    let year = Number.parseInt(DBYear);
    let month = Number.parseInt(DBMonth);
    let day = Number.parseInt(DBDay);
    let hour = Number.parseInt(DBHour);
    let minute = Number.parseInt(DBMinute);
    if (repeat === 'Yearly') {
        year++;
    }
    if (repeat === 'Monthly') {
        month + 1 > 12 ? ((month = 1), year++) : month++;
    }
    return {
        date: `${padTo2Digits(month.toString())}/${padTo2Digits(day.toString())}/${year.toString()}`,
        time: `${padTo2Digits(hour.toString())}:${padTo2Digits(minute.toString())}:00.000Z`
    };
}
exports.nextReminder = nextReminder;
async function checkInputs(interaction, event, time, date, description, repeat) {
    let failed;
    const errors = [];
    let errorCount = 0;
    if (time) {
        const [hour, minute] = time.split(':');
        if (!Number.parseInt(hour) ||
            padTo2Digits(hour).length > 2 ||
            hour.indexOf(' ') >= 0) {
            if (hour !== '00') {
                errorCount++;
                errors.push({
                    content: `**${errorCount}**) **Invalid Hours** - Only numbers can be used to set Hours. (Example: 13:30 for 1:30 pm)`
                });
                failed = true;
            }
        }
        if (Number.parseInt(hour) > 23 || Number.parseInt(hour) < 0) {
            errorCount++;
            errors.push({
                content: `**${errorCount}**) **Invalid Hours** - Choose a number between 0 and 23. (Example: 13:30 for 1:30 pm)`
            });
            failed = true;
        }
        if (!Number.parseInt(minute) ||
            padTo2Digits(minute).length > 2 ||
            minute.indexOf(' ') >= 0) {
            if (minute !== '00') {
                errorCount++;
                errors.push({
                    content: `**${errorCount}**) **Invalid Minutes** - Only numbers can be used to set Minutes. (Example: 13:30 for 1:30 pm)`
                });
                failed = true;
            }
        }
        if (Number.parseInt(minute) > 59 || Number.parseInt(minute) < 0) {
            errorCount++;
            errors.push({
                content: `**${errorCount}**) **Invalid Minutes** - Choose a number between 0 and 59. (Example: 13:30 for 1:30 pm)`
            });
            failed = true;
        }
    }
    if (date) {
        const [month, day, year] = date.split('/') || date.split('-');
        if (!Number.parseInt(month) ||
            !Number.parseInt(day) ||
            !Number.parseInt(year)) {
            errorCount++;
            errors.push({
                content: `**${errorCount}**) **Invalid Date** - Only numbers can be used to set the Date`
            });
            failed = true;
        }
        if (Number.parseInt(month) > 12 ||
            year.length !== 4 ||
            Number.parseInt(day) > 31 ||
            month.indexOf(' ') >= 0 ||
            day.indexOf(' ') >= 0 ||
            year.indexOf(' ') >= 0) {
            errorCount++;
            errors.push({
                content: `**${errorCount}**) **Invalid Syntax** - Date is formatted MM/DD/YYYY`
            });
            failed = true;
        }
        if (repeat) {
            if (repeat === 'Monthly' && Number.parseInt(day) > 28) {
                errorCount++;
                errors.push({
                    content: `**${errorCount}**) **Invalid Setting Combo** - Day cannot be after the 28th with "Monthly" Repeat setting enabled. (Blame February <3)`
                });
                failed = true;
            }
        }
    }
    if (event.length > discord_js_utilities_1.EmbedLimits.MaximumTitleLength) {
        errorCount++;
        errors.push({
            content: `**${errorCount}**) **Limitation** - Event titles have a maximum length of ${discord_js_utilities_1.EmbedLimits.MaximumTitleLength} characters`
        });
        failed = true;
    }
    if (description) {
        if (description.length > discord_js_utilities_1.EmbedLimits.MaximumDescriptionLength) {
            errorCount++;
            errors.push({
                content: `**${errorCount}**) **Limitation** - Descriptions have a maximum length of ${discord_js_utilities_1.EmbedLimits.MaximumDescriptionLength} characters`
            });
            failed = true;
        }
    }
    if (failed) {
        const errorEmbed = new discord_js_1.MessageEmbed()
            .setColor('BLURPLE')
            .setAuthor({
            name: `Reminder - Error Message`,
            iconURL: interaction.user.displayAvatarURL()
        })
            .setDescription(`**There was an error processing your request!**`);
        const paginatedFieldTemplate = new discord_js_utilities_1.PaginatedFieldMessageEmbed()
            .setTitleField(`:x: Issues`)
            .setTemplate(errorEmbed)
            .setItems(errors)
            .formatItems((item) => `> ${item.content}`)
            .setItemsPerPage(10)
            .make();
        const embeds = paginatedFieldTemplate.pages.values().next().value.embeds; // convert to Regular Message Embed For Ephemeral Option
        await interaction.reply({ embeds: embeds, ephemeral: true });
    }
    // inputs Passed the Error check
    return true;
}
exports.checkInputs = checkInputs;
async function askForDateTime(interaction) {
    const modal = new discord_js_1.Modal()
        .setCustomId('Reminder-TimeZone' + interaction.id)
        .setTitle('Reminder - Save Time Zone');
    const time = new discord_js_1.TextInputComponent()
        .setCustomId('time' + interaction.id)
        .setLabel(`Enter your Current Time Ex. "14:30"`)
        .setPlaceholder('14:30')
        .setStyle('SHORT')
        .setRequired(true);
    const date = new discord_js_1.TextInputComponent()
        .setCustomId('date' + interaction.id)
        .setLabel(`Enter your Current Date Ex. "MM/DD/YYYY"`)
        .setPlaceholder('12/23/2022')
        .setStyle('SHORT')
        .setRequired(true);
    const rowOne = new discord_js_1.MessageActionRow().addComponents(date);
    const rowTwo = new discord_js_1.MessageActionRow().addComponents(time);
    modal.addComponents(rowOne, rowTwo);
    await interaction.showModal(modal);
    const filter = (response) => {
        return response.isModalSubmit();
    };
    const submission = await interaction.awaitModalSubmit({
        filter,
        time: 5 * time_utilities_1.Time.Minute
    });
    const dateInput = submission.fields.getTextInputValue('date' + interaction.id);
    const timeInput = submission.fields.getTextInputValue('time' + interaction.id);
    if (await checkInputs(submission, 'placeholder', timeInput, dateInput)) {
        await findTimeZone(interaction, timeInput, dateInput);
        await submission.reply({
            content: 'Your Time Zone Offset has been saved.',
            ephemeral: true
        });
    }
}
exports.askForDateTime = askForDateTime;
function padTo2Digits(num) {
    return num.toString().padStart(2, '0');
}
//# sourceMappingURL=handleReminders.js.map