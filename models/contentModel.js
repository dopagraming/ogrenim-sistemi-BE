import mongoose from "mongoose";

const articleSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            trim: true,
            default: "",
            maxlength: 180,
        },
        image: {
            type: String,
            trim: true,
            default: "",
        },
        html: {
            type: String,
            required: true,
        },
        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Teacher",
            required: true,
        },
    },
    { timestamps: true }
);

const Article = mongoose.model("Article", articleSchema);
export default Article;