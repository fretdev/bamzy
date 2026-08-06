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

export interface StompConnectCallbacks {
    onMessage: (message: IMessage) => void;
    onConnectSuccess?: () => void;
    onDisconnect?: () => void;
}

export function connectStomp(
    token: string,
    callbacks: StompConnectCallbacks | ((message: IMessage) => void),
    username: string
): Promise<Client> {
    const onMessage = typeof callbacks === 'function' ? callbacks : callbacks.onMessage;
    const onConnectSuccess = typeof callbacks === 'object' ? callbacks.onConnectSuccess : undefined;
    const onDisconnect = typeof callbacks === 'object' ? callbacks.onDisconnect : undefined;

    return new Promise((resolve, reject) => {
        const wsUrl = getWebSocketUrl();
        console.log("Connecting STOMP WebSocket to:", wsUrl);

        let resolved = false;

        const client = new Client({
            webSocketFactory: () => new SockJS(wsUrl),
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            reconnectDelay: 3000,           // Auto-reconnect after 3s if disconnected
            heartbeatIncoming: 10000,       // Keep connection warm every 10s
            heartbeatOutgoing: 10000,
            onConnect: () => {
                client.subscribe(`/topic/messages/${username}`, onMessage);
                onConnectSuccess?.();
                if (!resolved) {
                    resolved = true;
                    resolve(client);
                }
            },
            onWebSocketClose: () => {
                onDisconnect?.();
            },
            onStompError: (frame) => {
                onDisconnect?.();
                if (!resolved) {
                    resolved = true;
                    reject(new Error(frame.headers["message"] || "STOMP connection error"));
                }
            },
        });

        client.activate();
    });
}

export function sendChatMessage(client: Client, receiverUsername: string, content: string) {
    if (!client || !client.connected) {
        console.warn("STOMP client is not connected. Queuing/skipping message.");
        return;
    }

    client.publish({
        destination: "/app/chat.send",
        body: JSON.stringify({ receiverUsername, content }),
    });
}