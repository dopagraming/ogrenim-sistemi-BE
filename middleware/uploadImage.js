import multer from "multer";
import path from "path";
import fs from "fs";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10);

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");
const ARTICLE_DIR = path.join(UPLOAD_ROOT, "articles");

if (!fs.existsSync(UPLOAD_ROOT)) fs.mkdirSync(UPLOAD_ROOT);
if (!fs.existsSync(ARTICLE_DIR)) fs.mkdirSync(ARTICLE_DIR);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, ARTICLE_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || "").toLowerCase();
        cb(null, `${Date.now()}_${nanoid()}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    const ok = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"].includes(file.mimetype);
    cb(ok ? null : new Error("Only image files are allowed"), ok);
};

export const uploadImage = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single("image");
