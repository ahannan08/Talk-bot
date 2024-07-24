import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        senderUsername: {
            type: String,
            required: true,
        },
        receiverUsername: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
        },
        readBy: [String], // Array to keep track of users who have read the message

    },
    { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;
