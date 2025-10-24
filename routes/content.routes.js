import express from "express";
import * as ctrl from "../controllers/content.controller.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadImage } from "../middleware/uploadImage.js";

const router = express.Router();


router.post("/upload-image", protect, (req, res) => {
    uploadImage(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message || "Upload failed" });
        }
        if (!req.file) {
            return res.status(400).json({ message: "No file provided" });
        }
        const host = `${req.protocol}://${req.get("host")}`;
        const url = `${host}/uploads/articles/${req.file.filename}`;
        return res.status(200).json({ url });
    });
});

/**
 * @desc   Makale oluştur (HTML içerik)
 * @route  POST /api/teachers/articles
 * @access Private (Teacher)
 */
router.post("/articles", protect, ctrl.createArticle);

/**
 * @desc   Makale getir (HTML içerik)
 * @route  GET /api/teachers/articles/:id
 * @access Public
 */
router.get("/:id", ctrl.getOne);


/**
 * @desc   Öğretmenin makalelerini listele
 * @route  GET /api/teachers/:teacherId/articles
 * @access Public
 */
router.get("/:teacherId/articles", ctrl.listArticles);

/**
 * @desc   Makale sil
 * @route  DELETE /api/teachers/:teacherId/articles/:articleId
 * @access Private (Teacher)
 */
router.delete("/:teacherId/articles/:articleId", protect, ctrl.deleteArticle);

/**
 * @desc   Makale güncelle
 * @route  PUT /api/teachers/:teacherId/articles/:articleId
 * @access Private (Teacher)
 */
router.put("/:teacherId/articles/:articleId", protect, ctrl.updateArticle);

export default router