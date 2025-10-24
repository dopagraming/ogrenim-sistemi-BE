import express from "express";
import expressAsyncHandler from "express-async-handler";
import multer from "multer";
import { protect } from "../middleware/authMiddleware.js";
import * as ctrl from "../controllers/publications.controller.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

/**
 * @desc   Yayın oluştur (manuel)
 * @route  POST /api/publications
 * @access Private (Teacher)
 */
router.post("/", protect, upload.single("pdf"), expressAsyncHandler(ctrl.createPublication));

/**
 * @desc   Yayınları listele (filtre/arama)
 * @route  GET /api/publications
 * @access Private (Teacher)
 */
router.get("/", protect, expressAsyncHandler(ctrl.listPublications));

/**
 * @desc   Yayını güncelle
 * @route  PUT /api/publications/:id
 * @access Private (Teacher)
 */
router.put("/:id", protect, expressAsyncHandler(ctrl.updatePublication));

/**
 * @desc   Yayını sil
 * @route  DELETE /api/publications/:id
 * @access Private (Teacher)
 */
router.delete("/:id", protect, expressAsyncHandler(ctrl.deletePublication));

/**
 * @desc   PDF yükle/güncelle
 * @route  PUT /api/publications/:id/upload-pdf
 * @access Private (Teacher)
 */
router.put("/:id/upload-pdf", protect, upload.single("pdf"), expressAsyncHandler(ctrl.uploadPdf));

/**
 * @desc   (Public) Öğretmenin görünür yayınlarını türe göre gruplu getir
 * @route  GET /api/publications/grouped/:teacherId
 * @access Public
 */
router.get("/grouped/:teacherId", expressAsyncHandler(ctrl.groupedPublicationsPublic));

/**
 * @desc   Google Scholar’dan öneri listesi (öğretmenin hesabına göre)
 * @route  GET /api/publications/scholar/check
 * @access Private (Teacher)
 */
router.get("/scholar/check", protect, expressAsyncHandler(ctrl.scholarCheck));

/**
 * @desc   Scholar’dan toplu içe aktarma
 * @route  POST /api/publications/scholar/import
 * @access Private (Teacher)
 */
router.post("/scholar/import", protect, expressAsyncHandler(ctrl.scholarImport));

export default router;
