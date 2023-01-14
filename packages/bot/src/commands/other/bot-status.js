"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotStatusCommand = void 0;
const discord_js_utilities_1 = require("@sapphire/discord.js-utilities");
const decorators_1 = require("@sapphire/decorators");
const framework_1 = require("@sapphire/framework");
const discord_js_1 = require("discord.js");
const os = __importStar(require("os"));
// @ts-ignore
const package_json_1 = __importDefault(require("../../../package.json"));
let BotStatusCommand = class BotStatusCommand extends framework_1.Command {
    async chatInputRun(interaction) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        const ping = Date.now() - interaction.createdTimestamp;
        const apiPing = Math.round(interaction.client.ws.ping);
        const admin = await ((_a = interaction.guild) === null || _a === void 0 ? void 0 : _a.fetchOwner());
        const isAdmin = (admin === null || admin === void 0 ? void 0 : admin.id) == interaction.user.id ? true : false;
        await ((_b = interaction.client.application) === null || _b === void 0 ? void 0 : _b.fetch());
        const owner = (_c = interaction.client.application) === null || _c === void 0 ? void 0 : _c.owner;
        const isOwner = (owner === null || owner === void 0 ? void 0 : owner.id) == interaction.user.id ? true : false;
        function cpuAverage() {
            let totalIdle = 0, totalTick = 0, cpus = os.cpus();
            // Loop through CPU cores
            for (let i = 0; i < cpus.length; i++) {
                let cpu = cpus[i];
                totalTick +=
                    cpu.times.nice +
                        cpu.times.user +
                        cpu.times.irq +
                        cpu.times.sys +
                        cpu.times.idle;
                totalIdle += cpu.times.idle;
            }
            //Return the average Idle and Tick times
            return {
                idle: totalIdle / cpus.length,
                total: totalTick / cpus.length
            };
        }
        // function to calculate average of array
        const arrAvg = function (arr) {
            if (arr && arr.length >= 1) {
                const sumArr = arr.reduce((a, b) => a + b, 0);
                return sumArr / arr.length;
            }
            return;
        };
        // load average for the past 250 milliseconds calculated every 100
        function getCPULoadAVG(avgTime = 250, delay = 100) {
            return new Promise((resolve, reject) => {
                const n = ~~(avgTime / delay);
                if (n <= 1) {
                    reject('Error: interval to small');
                }
                let i = 0;
                let samples = [];
                const avg1 = cpuAverage();
                let interval = setInterval(() => {
                    if (i >= n) {
                        clearInterval(interval);
                        resolve(~~(arrAvg(samples) * 100));
                    }
                    const avg2 = cpuAverage();
                    const totalDiff = avg2.total - avg1.total;
                    const idleDiff = avg2.idle - avg1.idle;
                    samples[i] = 1 - idleDiff / totalDiff;
                    i++;
                }, delay);
            });
        }
        const commandTotal = (_d = interaction.client.application) === null || _d === void 0 ? void 0 : _d.commands.cache.size;
        const platform = os
            .platform()
            .replace(/win32/, 'Windows')
            .replace(/darwin/, 'MacOS')
            .replace(/linux/, 'Linux');
        const archInfo = os.arch();
        const libList = JSON.stringify(package_json_1.default.dependencies)
            .replace(/,/g, '\n')
            .replace(/"/g, '')
            .replace(/{/g, '')
            .replace(/}/g, '')
            .replace(/\^/g, '')
            .replace(/:/g, ': ');
        const used = process.memoryUsage().heapUsed / 1024 / 1024;
        const duration = process.uptime();
        let days = Math.floor((duration % 31536000) / 86400), hours = Math.floor((duration / 3600) % 24), minutes = Math.floor((duration / 60) % 60), seconds = Math.floor(duration % 60);
        const upTime = `${days > 0 ? days + ' D ' : ''}${hours > 0 ? hours + ' H ' : ''}${minutes > 0 ? minutes + ' M ' : ''}${seconds} S`;
        const guildCacheMap = interaction.client.guilds.cache;
        const guildCacheArray = Array.from(guildCacheMap, ([name, value]) => ({
            name,
            value
        }));
        let memberCount = 0;
        for (let i = 0; i < guildCacheArray.length; i++) {
            memberCount = memberCount + guildCacheArray[i].value.memberCount;
        }
        const PaginatedEmbed = new discord_js_utilities_1.PaginatedMessage();
        const StatusEmbed = new discord_js_1.MessageEmbed()
            .setThumbnail((_e = interaction.client.user) === null || _e === void 0 ? void 0 : _e.avatarURL())
            .setTitle(`${(_f = interaction.client.user) === null || _f === void 0 ? void 0 : _f.username} - Status`)
            .setColor('GREY');
        StatusEmbed.addField('Ping', `Interaction: ${ping}ms.
      Heartbeat: ${apiPing}ms.
      Round-trip: ${ping + apiPing}ms.`)
            .addField(`Uptime`, `${upTime}`)
            .addField('Available Commands', `${commandTotal} Commands Available`)
            .addField('Servers, Users', `On ${interaction.client.guilds.cache.size} servers, with a total of ${memberCount} users.`)
            .setFooter({ text: 'Created', iconURL: interaction.user.avatarURL() })
            .setTimestamp((_g = interaction.client.application) === null || _g === void 0 ? void 0 : _g.createdTimestamp);
        PaginatedEmbed.addPageEmbed(StatusEmbed);
        if (isAdmin && !isOwner) {
            const adminEmbed = new discord_js_1.MessageEmbed();
            adminEmbed
                .setThumbnail((_h = interaction.client.user) === null || _h === void 0 ? void 0 : _h.avatarURL())
                .setTitle(`Status of ${(_j = interaction.client.user) === null || _j === void 0 ? void 0 : _j.username} - Info`)
                .setColor('DARKER_GREY')
                .addField(`Memory Usage`, `${Math.round(used * 100) / 100}MB`, true)
                .addField(`Platform`, `${platform} ${archInfo}`, true)
                .addField('Dependency List', `node: ${process.version.replace(/v/, '')}
        ${libList}`)
                .setFooter({ text: 'Created', iconURL: interaction.user.avatarURL() })
                .setTimestamp((_k = interaction.client.application) === null || _k === void 0 ? void 0 : _k.createdTimestamp);
            PaginatedEmbed.addPageEmbed(adminEmbed);
        }
        // Show CPU Info to the Bot Maintainer Only
        if (isOwner) {
            const adminEmbed = new discord_js_1.MessageEmbed();
            adminEmbed
                .setThumbnail((_l = interaction.client.user) === null || _l === void 0 ? void 0 : _l.avatarURL())
                .setTitle(`${(_m = interaction.client.user) === null || _m === void 0 ? void 0 : _m.username} - Info`)
                .setColor('DARKER_GREY')
                .addField('CPU Load', (await getCPULoadAVG()) + '%', true)
                .addField(`Memory Usage`, `${Math.round(used * 100) / 100}MB`, true)
                .addField(`Platform`, `${platform} ${archInfo}`, true)
                .addField('Dependency List', `node: ${process.version.replace(/v/, '')}
        ${libList}`)
                .setFooter({
                text: 'Created',
                iconURL: interaction.user.avatarURL()
            })
                .setTimestamp((_o = interaction.client.application) === null || _o === void 0 ? void 0 : _o.createdTimestamp);
            PaginatedEmbed.addPageEmbed(adminEmbed);
        }
        // Removes the unwanted Menu Selection Row From Embed
        if (PaginatedEmbed.actions.size > 0)
            PaginatedEmbed.actions.delete('@sapphire/paginated-messages.goToPage');
        PaginatedEmbed.run(interaction);
    }
    registerApplicationCommands(registery) {
        registery.registerChatInputCommand({
            name: this.name,
            description: this.description
        });
    }
};
BotStatusCommand = __decorate([
    (0, decorators_1.ApplyOptions)({
        name: 'bot-status',
        description: `Shows the current system status`
    })
], BotStatusCommand);
exports.BotStatusCommand = BotStatusCommand;
//# sourceMappingURL=bot-status.js.map