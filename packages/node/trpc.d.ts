export declare const trpcNode: {
    user: {
        getUserById: {
            query: (input: {
                id: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                user: any;
            }>;
        };
        create: {
            mutate: (input: {
                id: string;
                name: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                user: any;
            }>;
        };
        delete: {
            mutate: (input: {
                id: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                user: any;
            }>;
        };
        updateTimeOffset: {
            mutate: (input: {
                id: string;
                timeOffset: number;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                userTime: any;
            }>;
        };
    };
    guild: {
        getGuild: {
            query: (input: {
                id: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                guild: any;
            }>;
        };
        getGuildFromAPI: {
            query: (input: {
                guildId: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                guild: import("discord-api-types/v10").APIGuild;
            }>;
        };
        getGuildAndUser: {
            query: (input: {
                id: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                guild: any;
                user: any;
            }>;
        };
        create: {
            mutate: (input: {
                id: string;
                name: string;
                ownerId: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                guild: any;
            }>;
        };
        createViaTwitchNotification: {
            mutate: (input: {
                name: string;
                guildId: string;
                ownerId: string;
                userId: string;
                notifyList: string[];
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<void>;
        };
        delete: {
            mutate: (input: {
                id: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                guild: any;
            }>;
        };
        updateWelcomeMessage: {
            mutate: (input: {
                guildId: string;
                welcomeMessage: string | null;
                welcomeMessageEnabled: boolean | null;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                guild: any;
            }>;
        };
        toggleWelcomeMessage: {
            mutate: (input: {
                status: boolean;
                guildId: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                guild: any;
            }>;
        };
        updateWelcomeMessageChannel: {
            mutate: (input: {
                guildId: string;
                channelId: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                guild: any;
            }>;
        };
        getAllFromLocal: {
            query: (input: {
                ownerId: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                guilds: any;
            }>;
        };
        getAll: {
            query: (input?: void | undefined, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                guilds: any;
                apiGuilds?: undefined;
                dbGuilds?: undefined;
            } | {
                apiGuilds: import("discord-api-types/v10").APIGuild[];
                dbGuilds: any;
                guilds?: undefined;
            }>;
        };
        getAllFromDiscordAPI: {
            query: (input?: void | undefined, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                guilds: import("discord-api-types/v10").APIGuild[];
                discordId: any;
            }>;
        };
        updateTwitchNotifications: {
            mutate: (input: {
                guildId: string;
                notifyList: string[];
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<void>;
        };
        updateVolume: {
            mutate: (input: {
                guildId: string;
                volume: number;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<void>;
        };
        getRoles: {
            query: (input: {
                guildId: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                roles: import("discord-api-types/v10").APIRole[];
            }>;
        };
    };
    playlist: {
        getPlaylist: {
            query: (input: {
                name: string;
                userId: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                playlist: any;
            }>;
        };
        getAll: {
            query: (input: {
                userId: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                playlists: any;
            }>;
        };
        create: {
            mutate: (input: {
                name: string;
                userId: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                playlist: any;
            }>;
        };
        delete: {
            mutate: (input: {
                name: string;
                userId: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                playlist: any;
            }>;
        };
    };
    song: {
        createMany: {
            mutate: (input: {
                songs: any[];
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                songsCreated: any;
            }>;
        };
        delete: {
            mutate: (input: {
                id: number;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                song: any;
            }>;
        };
    };
    twitch: any;
    channel: {
        getAll: {
            query: (input: {
                guildId: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                channels: import("discord-api-types/v10").APIGuildTextChannel<0>[];
            }>;
        };
    };
    welcome: {
        getMessage: {
            query: (input: {
                guildId: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                message: any;
            }>;
        };
        setMessage: {
            mutate: (input: {
                message: string;
                guildId: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                guild: any;
            }>;
        };
        setChannel: {
            mutate: (input: {
                guildId: string;
                channelId: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                guild: any;
            }>;
        };
        getChannel: {
            query: (input: {
                guildId: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                guild: any;
            }>;
        };
        getStatus: {
            query: (input: {
                guildId: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                guild: any;
            }>;
        };
        toggle: {
            mutate: (input: {
                status: boolean;
                guildId: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                guild: any;
            }>;
        };
    };
    command: {
        getDisabledCommands: {
            query: (input: {
                guildId: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                disabledCommands: any;
            }>;
        };
        getCommands: {
            query: (input: {
                guildId: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                commands: import("@bbc-bot/api/src/routers/command").CommandType[];
            }>;
        };
        getCommandAndGuildChannels: {
            query: (input: {
                guildId: string;
                commandId: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                channels: import("discord-api-types/v10").APIGuildChannel<import("discord-api-types/v10").ChannelType>[];
                roles: import("discord-api-types/v10").APIRole[];
                command: import("@bbc-bot/api/src/routers/command").CommandType;
                permissions: any;
            }>;
        };
        getCommandPermissions: {
            query: (input: {
                guildId: string;
                commandId: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                command: any;
            }>;
        };
        editCommandPermissions: {
            mutate: (input: {
                type: string;
                guildId: string;
                commandId: string;
                permissions: {
                    id: string;
                    type: number;
                    permission: boolean;
                }[];
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                command: any;
            }>;
        };
        toggleCommand: {
            mutate: (input: {
                status: boolean;
                guildId: string;
                commandId: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                updatedGuild: any;
            }>;
        };
    };
    hub: {
        create: {
            mutate: (input: {
                name: string;
                guildId: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                guild: any;
            }>;
        };
        delete: {
            mutate: (input: {
                guildId: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<void>;
        };
        getTempChannel: {
            query: (input: {
                guildId: string;
                ownerId: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                tempChannel: any;
            }>;
        };
        createTempChannel: {
            mutate: (input: {
                guildId: string;
                ownerId: string;
                channelId: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                tempChannel: any;
            }>;
        };
        deleteTempChannel: {
            mutate: (input: {
                channelId: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                tempChannel: any;
            }>;
        };
    };
    reminder: {
        getAll: {
            query: (input?: void | undefined, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                reminders: any;
            }>;
        };
        getReminder: {
            mutate: (input: {
                userId: string;
                event: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                reminder: any;
            }>;
        };
        getByUserId: {
            mutate: (input: {
                userId: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                reminders: any;
            }>;
        };
        create: {
            mutate: (input: {
                timeOffset: number;
                userId: string;
                event: string;
                description: string | null;
                dateTime: string;
                repeat: string | null;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                reminder: any;
            }>;
        };
        delete: {
            mutate: (input: {
                userId: string;
                event: string;
            }, opts?: import("@trpc/server").ProcedureOptions | undefined) => Promise<{
                reminder: any;
            }>;
        };
    };
};
