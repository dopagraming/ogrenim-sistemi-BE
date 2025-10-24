import mongoose from "mongoose";

const invitationSchema = new mongoose.Schema({
    email: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

const Invitation = mongoose.model("Invitation", invitationSchema)

export default Invitation;