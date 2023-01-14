import { APIGuildChannel, APIRole, ChannelType, APIApplicationCommandPermission } from 'discord-api-types/v10';
export type CommandType = {
    code: number;
    id: string;
    applicationId: string;
    version: string;
    default_permission: string;
    default_member_permissions: null | string[];
    type: number;
    name: string;
    description: string;
    dm_permission: boolean;
    options: any[];
};
export type CommandPermissionsResponseOkay = {
    id: string;
    application_id: string;
    guild_id: string;
    permissions: APIApplicationCommandPermission[];
};
export type CommandPermissionsResponseNotOkay = {
    message: string;
    code: number;
};
export declare const commandRouter: import("@trpc/server").CreateRouterInner<import("@trpc/server").RootConfig<{
    ctx: any;
    meta: object;
    errorShape: import("@trpc/server").DefaultErrorShape;
    transformer: typeof import("superjson").default;
}>, {
    getDisabledCommands: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: any;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: typeof import("superjson").default;
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
            transformer: typeof import("superjson").default;
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
        commands: CommandType[];
    }>;
    getCommandAndGuildChannels: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: any;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: typeof import("superjson").default;
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
        channels: APIGuildChannel<ChannelType>[];
        roles: APIRole[];
        command: CommandType;
        permissions: any;
    }>;
    getCommandPermissions: import("@trpc/server").BuildProcedure<"query", {
        _config: import("@trpc/server").RootConfig<{
            ctx: any;
            meta: object;
            errorShape: import("@trpc/server").DefaultErrorShape;
            transformer: typeof import("superjson").default;
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
            transformer: typeof import("superjson").default;
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
            transformer: typeof import("superjson").default;
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
