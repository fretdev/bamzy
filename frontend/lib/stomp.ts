import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

function getWebSocketUrl(): string {
    const customWs = process.env.NEXT_PUBLIC_WS_URL;
    if (customWs && customWs.trim()) {
        return customWs.trim();
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const cleanUrl = apiUrl.replace(/\/$/, '');
    return `${cleanUrl}/ws`;
}

export function connectStomp(
    token: string,
    onMessage: (message: IMessage) => void,
    username: string
): Promise<Client> {
    return new Promise((resolve, reject) => {
        const wsUrl = getWebSocketUrl();
        console.log("Connecting STOMP WebSocket to:", wsUrl);

        const client = new Client({
            webSocketFactory: () => new SockJS(wsUrl),
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