import express from "express";
import expressAsyncHandler from "express-async-handler";
import { protect, protectStudent } from "../middleware/authMiddleware.js";
import * as ctrl from "../controllers/makaleler.controller.js";

const router = express.Router();

/**
 * @desc Belirli öğretmene ait tüm makaleleri getir
 * @route GET /api/makaleler
 * @access Private (Teacher)
 */
router.get("/", protect, expressAsyncHandler(ctrl.getAllForTeacher));

/**
 * @desc Öğretmenin aldığı öğrenci gönderimlerini listele (arama + filtre + sayfalama)
 * @route GET /api/makaleler/submissions
 * @access Private (Teacher)
 */
router.get("/submissions", protect, expressAsyncHandler(ctrl.getSubmissions));

/**
 * @desc Öğretmen tarafından yeni makale oluştur
 * @route POST /api/makaleler/teacher
 * @access Private (Teacher)
 */
router.post("/teacher", protect, expressAsyncHandler(ctrl.createByTeacher));

/**
 * @desc Öğretmenin, belirli öğrencinin gönderimi için karar vermesi
 * @route PUT /api/makaleler/:articleId/decision
 * @access Private (Teacher)
 */
router.put(
    "/:articleId/decision",
    protect,
    expressAsyncHandler(ctrl.setSubmissionDecision)
);

/**
 * @desc Makaleyi güncelle
 * @route PUT /api/makaleler/:id
 * @access Private (Teacher)
 */
router.put("/:id", protect, expressAsyncHandler(ctrl.updateMakale));

/**
 * @desc Makaleyi sil
 * @route DELETE /api/makaleler/:id
 * @access Private (Teacher)
 */
router.delete("/:id", protect, expressAsyncHandler(ctrl.deleteMakale));

/**
 * @desc Öğrenciye atanmış makaleleri getir
 * @route GET /api/makaleler/:studentId/makaleler
 * @access Private (Teacher/Student) — kontrolü controller’da
 */
router.get(
    "/:studentId/makaleler",
    expressAsyncHandler(ctrl.getForStudent)
);

/**
 * @desc Öğrencinin makaleye gönderim yapması (submit)
 * @route PUT /api/makaleler/:id/student-submit
 * @access Private (Student)
 */
router.put(
    "/:id/student-submit",
    protectStudent,
    expressAsyncHandler(ctrl.studentSubmit)
);

/**
 * @desc Öğrencinin taslak kaydetmesi (submit etmeden)
 * @route PUT /api/makaleler/:id/student-save
 * @access Private (Student)
 */
router.put(
    "/:id/student-save",
    protectStudent,
    expressAsyncHandler(ctrl.studentSaveDraft)
);

/**
 * @desc Öğrencinin doğrudan makale eklemesi (otomatik onay)
 * @route POST /api/makaleler/student-direct-add
 * @access Private (Student)
 */
router.post(
    "/student-direct-add",
    protectStudent,
    expressAsyncHandler(ctrl.studentDirectAdd)
);

/**
 * @desc Öğrencinin makale önerisi göndermesi (öğretmen onayı bekler)
 * @route POST /api/makaleler/student-request-add
 * @access Private (Student)
 */
router.post(
    "/student-request-add",
    protectStudent,
    expressAsyncHandler(ctrl.studentRequestAdd)
);

/**
 * @desc Öğretmenin, öğrenci önerisi için karar vermesi (approve/reject)
 * @route PUT /api/makaleler/:articleId/proposal-decision
 * @access Private (Teacher)
 */
router.put(
    "/:articleId/proposal-decision",
    protect,
    expressAsyncHandler(ctrl.setProposalDecision)
);

/**
 * @desc Tek bir makaleyi ID ile getir
 * @route GET /api/makaleler/:id
 * @access Public
 *
 * Not: Parametreli rotalar (/:id) yukarıdaki spesifik rotalardan sonra tanımlanmalı.
 */
router.get("/:id", expressAsyncHandler(ctrl.getById));

export default router;
