import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import * as ctrl from "../controllers/auth.controller.js";
import { uploadImage } from "../middleware/uploadImage.js";

const router = express.Router();

/**
 * @desc   Yeni öğretmen kaydı
 * @route  POST /api/auth/register
 * @access Public
 */
router.post("/register", ctrl.register);

/**
 * @desc   Giriş (öğretmen/öğrenci)
 * @route  POST /api/auth/login
 * @access Public
 */
router.post("/login", ctrl.login);

/**
 * @desc   Öğretmen profilini getir
 * @route  GET /api/auth/profile
 * @access Private (Teacher)
 */
router.get("/profile", protect, ctrl.getProfile);

/**
 * @desc   Öğretmen profilini güncelle
 * @route  PUT /api/auth/profile
 * @access Private (Teacher)
 */
router.put("/profile", protect, ctrl.updateProfile);

/**
 * @desc   Profil fotoğrafı yükle (returns { url })
 * @route  POST /api/auth/profile/photo
 * @access Private (Teacher)
 */
router.post("/profile/photo", protect, (req, res) => {
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

export default router;
