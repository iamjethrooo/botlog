declare class PubSub {
    publish(channel: string, message: string): void;
    subscribe(channel: string): void;
    on(event: string, callback: Function): void;
}
declare const instance: PubSub;
export default instance;
