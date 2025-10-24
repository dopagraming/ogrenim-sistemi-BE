import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import * as ctrl from "../controllers/appointments.controller.js";

const router = express.Router();

/**
 * @desc   Yeni randevu oluştur
 * @route  POST /api/appointments
 * @access Public
 */
router.post("/", ctrl.createNewAppointment);

/**
 * @desc   Öğretmenin randevularını listele
 * @route  GET /api/appointments/teacher
 * @access Private (Teacher)
 */
router.get("/teacher", protect, ctrl.getAppointments);

/**
 * @desc   Randevu durumunu güncelle (accepted/rejected)
 * @route  PUT /api/appointments/:id/status
 * @access Private (Teacher)
 */
router.put("/:id/status", protect, ctrl.updateAppointmentStatus);

/**
 * @desc   Randevuyu başka slot’a taşı (kapasite kontrolü ile)
 * @route  PUT /api/appointments/:id/move
 * @access Private (Teacher)
 */
router.put("/:id/move", protect, ctrl.moveAppointment);

/**
 * @desc   Seçilen günün TÜM randevularını başka güne taşı (aynı saatlere eşleyerek)
 * @route  PUT /api/appointments/teacher/:teacherId/move-day
 * @access Private (Teacher or Admin)
 */
router.put("/move-day", protect, ctrl.moveDay);


/**
 * @desc   Randevuyu sil
 * @route  DELETE /api/appointments/:id
 * @access Private (Teacher)
 */
router.delete("/:id", protect, ctrl.deleteAppointment);

/**
 * @desc   Randevu istatistikleri (toplam/accepted/pending/rejected)
 * @route  GET /api/appointments/stats?teacherId=...
 * @access Public
 */
router.get("/stats", ctrl.getBookingCountStats);

/**
 * @desc   Öğretmen için yaklaşan randevular
 * @route  GET /api/appointments/teacher/upcoming?teacherId=...&limit=5
 * @access Private (Teacher)
 */
router.get("/teacher/upcoming", protect, ctrl.getUpcomingAppointmentsByTeacher);

export default router;
