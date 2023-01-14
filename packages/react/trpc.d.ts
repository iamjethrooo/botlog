import superjson from 'superjson';
export declare const trpc: import("@trpc/next").CreateTRPCNextBase<import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: any;
    meta: object;
    errorShape: import("@trpc/server").DefaultErrorShape;
    transformer: typeof superjson;
}>, {
    user: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: any;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        getUserById: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            user: any;
        }>;
        create: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                id: string;
                name: string;
            };
            _input_out: {
                id: string;
                name: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            user: any;
        }>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            user: any;
        }>;
        updateTimeOffset: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                id: string;
                timeOffset: number;
            };
            _input_out: {
                id: string;
                timeOffset: number;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            userTime: any;
        }>;
    }>;
    guild: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: any;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        getGuild: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guild: any;
        }>;
        getGuildFromAPI: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
            };
            _input_out: {
                guildId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guild: import("discord-api-types/v10").APIGuild;
        }>;
        getGuildAndUser: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guild: any;
            user: any;
        }>;
        create: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                id: string;
                name: string;
                ownerId: string;
            };
            _input_out: {
                id: string;
                name: string;
                ownerId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guild: any;
        }>;
        createViaTwitchNotification: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                name: string;
                guildId: string;
                ownerId: string;
                userId: string;
                notifyList: string[];
            };
            _input_out: {
                name: string;
                guildId: string;
                ownerId: string;
                userId: string;
                notifyList: string[];
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, void>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guild: any;
        }>;
        updateWelcomeMessage: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
                welcomeMessage: string | null;
                welcomeMessageEnabled: boolean | null;
            };
            _input_out: {
                guildId: string;
                welcomeMessage: string | null;
                welcomeMessageEnabled: boolean | null;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guild: any;
        }>;
        toggleWelcomeMessage: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                status: boolean;
                guildId: string;
            };
            _input_out: {
                status: boolean;
                guildId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guild: any;
        }>;
        updateWelcomeMessageChannel: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
                channelId: string;
            };
            _input_out: {
                guildId: string;
                channelId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guild: any;
        }>;
        getAllFromLocal: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                ownerId: string;
            };
            _input_out: {
                ownerId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guilds: any;
        }>;
        getAll: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _ctx_out: any;
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
            _meta: object;
        }, {
            guilds: any;
            apiGuilds?: undefined;
            dbGuilds?: undefined;
        } | {
            apiGuilds: import("discord-api-types/v10").APIGuild[];
            dbGuilds: any;
            guilds?: undefined;
        }>;
        getAllFromDiscordAPI: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _ctx_out: any;
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
            _meta: object;
        }, {
            guilds: import("discord-api-types/v10").APIGuild[];
            discordId: any;
        }>;
        updateTwitchNotifications: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
                notifyList: string[];
            };
            _input_out: {
                guildId: string;
                notifyList: string[];
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, void>;
        updateVolume: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
                volume: number;
            };
            _input_out: {
                guildId: string;
                volume: number;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, void>;
        getRoles: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
            };
            _input_out: {
                guildId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            roles: import("discord-api-types/v10").APIRole[];
        }>;
    }>;
    playlist: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: any;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        getPlaylist: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                name: string;
                userId: string;
            };
            _input_out: {
                name: string;
                userId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            playlist: any;
        }>;
        getAll: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                userId: string;
            };
            _input_out: {
                userId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            playlists: any;
        }>;
        create: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                name: string;
                userId: string;
            };
            _input_out: {
                name: string;
                userId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            playlist: any;
        }>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                name: string;
                userId: string;
            };
            _input_out: {
                name: string;
                userId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            playlist: any;
        }>;
    }>;
    song: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: any;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        createMany: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                songs: any[];
            };
            _input_out: {
                songs: any[];
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            songsCreated: any;
        }>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                id: number;
            };
            _input_out: {
                id: number;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            song: any;
        }>;
    }>;
    twitch: any;
    channel: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: any;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        getAll: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
            };
            _input_out: {
                guildId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            channels: import("discord-api-types/v10").APIGuildTextChannel<0>[];
        }>;
    }>;
    welcome: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: any;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        getMessage: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
            };
            _input_out: {
                guildId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            message: any;
        }>;
        setMessage: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                message: string;
                guildId: string;
            };
            _input_out: {
                message: string;
                guildId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guild: any;
        }>;
        setChannel: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
                channelId: string;
            };
            _input_out: {
                guildId: string;
                channelId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guild: any;
        }>;
        getChannel: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
            };
            _input_out: {
                guildId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guild: any;
        }>;
        getStatus: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
            };
            _input_out: {
                guildId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guild: any;
        }>;
        toggle: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                status: boolean;
                guildId: string;
            };
            _input_out: {
                status: boolean;
                guildId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guild: any;
        }>;
    }>;
    command: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: any;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        getDisabledCommands: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
            };
            _input_out: {
                guildId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            disabledCommands: any;
        }>;
        getCommands: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
            };
            _input_out: {
                guildId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            commands: import("@bbc-bot/api/src/routers/command").CommandType[];
        }>;
        getCommandAndGuildChannels: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
                commandId: string;
            };
            _input_out: {
                guildId: string;
                commandId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            channels: import("discord-api-types/v10").APIGuildChannel<import("discord-api-types/v10").ChannelType>[];
            roles: import("discord-api-types/v10").APIRole[];
            command: import("@bbc-bot/api/src/routers/command").CommandType;
            permissions: any;
        }>;
        getCommandPermissions: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
                commandId: string;
            };
            _input_out: {
                guildId: string;
                commandId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            command: any;
        }>;
        editCommandPermissions: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                type: string;
                guildId: string;
                commandId: string;
                permissions: {
                    id: string;
                    type: number;
                    permission: boolean;
                }[];
            };
            _input_out: {
                type: string;
                guildId: string;
                commandId: string;
                permissions: {
                    id: string;
                    type: number;
                    permission: boolean;
                }[];
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            command: any;
        }>;
        toggleCommand: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                status: boolean;
                guildId: string;
                commandId: string;
            };
            _input_out: {
                status: boolean;
                guildId: string;
                commandId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            updatedGuild: any;
        }>;
    }>;
    hub: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: any;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        create: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                name: string;
                guildId: string;
            };
            _input_out: {
                name: string;
                guildId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guild: any;
        }>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
            };
            _input_out: {
                guildId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, void>;
        getTempChannel: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
                ownerId: string;
            };
            _input_out: {
                guildId: string;
                ownerId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            tempChannel: any;
        }>;
        createTempChannel: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
                ownerId: string;
                channelId: string;
            };
            _input_out: {
                guildId: string;
                ownerId: string;
                channelId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            tempChannel: any;
        }>;
        deleteTempChannel: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                channelId: string;
            };
            _input_out: {
                channelId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            tempChannel: any;
        }>;
    }>;
    reminder: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: any;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        getAll: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _ctx_out: any;
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
            _meta: object;
        }, {
            reminders: any;
        }>;
        getReminder: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                userId: string;
                event: string;
            };
            _input_out: {
                userId: string;
                event: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            reminder: any;
        }>;
        getByUserId: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                userId: string;
            };
            _input_out: {
                userId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            reminders: any;
        }>;
        create: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                timeOffset: number;
                userId: string;
                event: string;
                description: string | null;
                dateTime: string;
                repeat: string | null;
            };
            _input_out: {
                timeOffset: number;
                userId: string;
                event: string;
                description: string | null;
                dateTime: string;
                repeat: string | null;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            reminder: any;
        }>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                userId: string;
                event: string;
            };
            _input_out: {
                userId: string;
                event: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            reminder: any;
        }>;
    }>;
}>, import("next/types").NextPageContext> & import("@trpc/react-query/shared").DecoratedProcedureRecord<{
    user: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: any;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        getUserById: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            user: any;
        }>;
        create: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                id: string;
                name: string;
            };
            _input_out: {
                id: string;
                name: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            user: any;
        }>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            user: any;
        }>;
        updateTimeOffset: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                id: string;
                timeOffset: number;
            };
            _input_out: {
                id: string;
                timeOffset: number;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            userTime: any;
        }>;
    }>;
    guild: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: any;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        getGuild: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guild: any;
        }>;
        getGuildFromAPI: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
            };
            _input_out: {
                guildId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guild: import("discord-api-types/v10").APIGuild;
        }>;
        getGuildAndUser: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guild: any;
            user: any;
        }>;
        create: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                id: string;
                name: string;
                ownerId: string;
            };
            _input_out: {
                id: string;
                name: string;
                ownerId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guild: any;
        }>;
        createViaTwitchNotification: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                name: string;
                guildId: string;
                ownerId: string;
                userId: string;
                notifyList: string[];
            };
            _input_out: {
                name: string;
                guildId: string;
                ownerId: string;
                userId: string;
                notifyList: string[];
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, void>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                id: string;
            };
            _input_out: {
                id: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guild: any;
        }>;
        updateWelcomeMessage: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
                welcomeMessage: string | null;
                welcomeMessageEnabled: boolean | null;
            };
            _input_out: {
                guildId: string;
                welcomeMessage: string | null;
                welcomeMessageEnabled: boolean | null;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guild: any;
        }>;
        toggleWelcomeMessage: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                status: boolean;
                guildId: string;
            };
            _input_out: {
                status: boolean;
                guildId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guild: any;
        }>;
        updateWelcomeMessageChannel: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
                channelId: string;
            };
            _input_out: {
                guildId: string;
                channelId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guild: any;
        }>;
        getAllFromLocal: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                ownerId: string;
            };
            _input_out: {
                ownerId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guilds: any;
        }>;
        getAll: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _ctx_out: any;
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
            _meta: object;
        }, {
            guilds: any;
            apiGuilds?: undefined;
            dbGuilds?: undefined;
        } | {
            apiGuilds: import("discord-api-types/v10").APIGuild[];
            dbGuilds: any;
            guilds?: undefined;
        }>;
        getAllFromDiscordAPI: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _ctx_out: any;
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
            _meta: object;
        }, {
            guilds: import("discord-api-types/v10").APIGuild[];
            discordId: any;
        }>;
        updateTwitchNotifications: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
                notifyList: string[];
            };
            _input_out: {
                guildId: string;
                notifyList: string[];
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, void>;
        updateVolume: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
                volume: number;
            };
            _input_out: {
                guildId: string;
                volume: number;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, void>;
        getRoles: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
            };
            _input_out: {
                guildId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            roles: import("discord-api-types/v10").APIRole[];
        }>;
    }>;
    playlist: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: any;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        getPlaylist: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                name: string;
                userId: string;
            };
            _input_out: {
                name: string;
                userId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            playlist: any;
        }>;
        getAll: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                userId: string;
            };
            _input_out: {
                userId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            playlists: any;
        }>;
        create: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                name: string;
                userId: string;
            };
            _input_out: {
                name: string;
                userId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            playlist: any;
        }>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                name: string;
                userId: string;
            };
            _input_out: {
                name: string;
                userId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            playlist: any;
        }>;
    }>;
    song: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: any;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        createMany: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                songs: any[];
            };
            _input_out: {
                songs: any[];
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            songsCreated: any;
        }>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                id: number;
            };
            _input_out: {
                id: number;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            song: any;
        }>;
    }>;
    twitch: any;
    channel: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: any;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        getAll: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
            };
            _input_out: {
                guildId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            channels: import("discord-api-types/v10").APIGuildTextChannel<0>[];
        }>;
    }>;
    welcome: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: any;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        getMessage: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
            };
            _input_out: {
                guildId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            message: any;
        }>;
        setMessage: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                message: string;
                guildId: string;
            };
            _input_out: {
                message: string;
                guildId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guild: any;
        }>;
        setChannel: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
                channelId: string;
            };
            _input_out: {
                guildId: string;
                channelId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guild: any;
        }>;
        getChannel: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
            };
            _input_out: {
                guildId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guild: any;
        }>;
        getStatus: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
            };
            _input_out: {
                guildId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guild: any;
        }>;
        toggle: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                status: boolean;
                guildId: string;
            };
            _input_out: {
                status: boolean;
                guildId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guild: any;
        }>;
    }>;
    command: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: any;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        getDisabledCommands: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
            };
            _input_out: {
                guildId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            disabledCommands: any;
        }>;
        getCommands: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
            };
            _input_out: {
                guildId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            commands: import("@bbc-bot/api/src/routers/command").CommandType[];
        }>;
        getCommandAndGuildChannels: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
                commandId: string;
            };
            _input_out: {
                guildId: string;
                commandId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            channels: import("discord-api-types/v10").APIGuildChannel<import("discord-api-types/v10").ChannelType>[];
            roles: import("discord-api-types/v10").APIRole[];
            command: import("@bbc-bot/api/src/routers/command").CommandType;
            permissions: any;
        }>;
        getCommandPermissions: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
                commandId: string;
            };
            _input_out: {
                guildId: string;
                commandId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            command: any;
        }>;
        editCommandPermissions: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                type: string;
                guildId: string;
                commandId: string;
                permissions: {
                    id: string;
                    type: number;
                    permission: boolean;
                }[];
            };
            _input_out: {
                type: string;
                guildId: string;
                commandId: string;
                permissions: {
                    id: string;
                    type: number;
                    permission: boolean;
                }[];
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            command: any;
        }>;
        toggleCommand: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                status: boolean;
                guildId: string;
                commandId: string;
            };
            _input_out: {
                status: boolean;
                guildId: string;
                commandId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            updatedGuild: any;
        }>;
    }>;
    hub: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: any;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        create: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                name: string;
                guildId: string;
            };
            _input_out: {
                name: string;
                guildId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            guild: any;
        }>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
            };
            _input_out: {
                guildId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, void>;
        getTempChannel: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
                ownerId: string;
            };
            _input_out: {
                guildId: string;
                ownerId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            tempChannel: any;
        }>;
        createTempChannel: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                guildId: string;
                ownerId: string;
                channelId: string;
            };
            _input_out: {
                guildId: string;
                ownerId: string;
                channelId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            tempChannel: any;
        }>;
        deleteTempChannel: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                channelId: string;
            };
            _input_out: {
                channelId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            tempChannel: any;
        }>;
    }>;
    reminder: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
        ctx: any;
        meta: object;
        errorShape: import("@trpc/server").DefaultErrorShape;
        transformer: typeof superjson;
    }>, {
        getAll: import("@trpc/server").BuildProcedure<"query", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _ctx_out: any;
            _input_in: typeof import("@trpc/server").unsetMarker;
            _input_out: typeof import("@trpc/server").unsetMarker;
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
            _meta: object;
        }, {
            reminders: any;
        }>;
        getReminder: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                userId: string;
                event: string;
            };
            _input_out: {
                userId: string;
                event: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            reminder: any;
        }>;
        getByUserId: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                userId: string;
            };
            _input_out: {
                userId: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            reminders: any;
        }>;
        create: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                timeOffset: number;
                userId: string;
                event: string;
                description: string | null;
                dateTime: string;
                repeat: string | null;
            };
            _input_out: {
                timeOffset: number;
                userId: string;
                event: string;
                description: string | null;
                dateTime: string;
                repeat: string | null;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            reminder: any;
        }>;
        delete: import("@trpc/server").BuildProcedure<"mutation", {
            _config: import("@trpc/server").RootConfig<{
                ctx: any;
                meta: object;
                errorShape: import("@trpc/server").DefaultErrorShape;
                transformer: typeof superjson;
            }>;
            _meta: object;
            _ctx_out: any;
            _input_in: {
                userId: string;
                event: string;
            };
            _input_out: {
                userId: string;
                event: string;
            };
            _output_in: typeof import("@trpc/server").unsetMarker;
            _output_out: typeof import("@trpc/server").unsetMarker;
        }, {
            reminder: any;
        }>;
    }>;
}, null, "">;
