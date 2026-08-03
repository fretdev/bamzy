import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL as string;

export function connectStomp(
    token: string,
    onMessage: (message: IMessage) => void,
    username: string
): Promise<Client> {
    return new Promise((resolve, reject) => {
        const client = new Client({
            webSocketFactory: () => new SockJS(WS_URL),
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            onConnect: () => {
                client.subscribe(`/topic/messages/${username}`, onMessage);
                resolve(client);
            },
            onStompError: (frame) => {
                reject(new Error(frame.headers["message"] || "STOMP connection error"));
            },
        });

        client.activate();
    });
}

export function sendChatMessage(client: Client, receiverUsername: string, content: string) {
    if (!client.connected) {
        throw new Error("STOMP client is not connected");
    }

    client.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({ receiverUsername, content }),
    });
}