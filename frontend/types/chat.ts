export interface MessageResponse{
    publicId: string;
    senderUsername: string;
    receiverUsername: string;
    content: string;
    status: "SENT" | "DELIVERED" | "READ";
    createdAt: string;
}