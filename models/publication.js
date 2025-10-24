import mongoose from "mongoose";

const publicationSchema = new mongoose.Schema({
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },

    title: { type: String, required: true, index: true },
    authors: { type: [String], default: [] },
    year: { type: Number },
    venue: { type: String },
    doi: { type: String },
    url: { type: String },
    pdfUrl: { type: String },

    type: {
        type: String,
        enum: ["article", "conference", "book_chapter", "book", "thesis", "other"],
        required: true
    },
    tags: { type: [String], default: [] },

    source: { type: String, enum: ["manual", "scholar", "import"], default: "manual" },
    externalId: { type: String },
    isVisible: { type: Boolean, default: true },
    scholarProfileUrl: String,
    scholarUserId: String
}, { timestamps: true });

const Publication = mongoose.model("Publication", publicationSchema);
export default Publication;
