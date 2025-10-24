import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import * as ctrl from "../controllers/slots.controller.js";

const router = express.Router();

/**
 * @desc   Öğretmen için yeni zaman aralığı oluştur
 * @route  POST /api/slots/:teacherId/timeslots
 * @access Private (Teacher)
 */
router.post("/:teacherId/timeslots", protect, ctrl.createSlot);

/**
 * @desc   Öğretmenin tüm zaman aralıklarını getir
 * @route  GET /api/slots/:teacherId/timeslots
 * @access Public
 */
router.get("/:teacherId/timeslots", ctrl.getSlots);

/**
 * @desc   Uygun (boş) zaman aralıklarını getir
 * @route  GET /api/slots/:teacherId/timeslots/available
 * @access Private (Teacher)
 */
router.get("/:teacherId/timeslots/available", protect, ctrl.getAvailableSlots);

/**
 * @desc   Tek bir zaman aralığını getir
 * @route  GET /api/slots/:teacherId/timeslots/:timeSlotId
 * @access Public
 */
router.get("/:teacherId/timeslots/:timeSlotId", ctrl.getSlotById);

/**
 * @desc   Zaman aralığını güncelle
 * @route  PUT /api/slots/:teacherId/timeslots/:timeSlotId
 * @access Private (Teacher)
 */
router.put("/:teacherId/timeslots/:timeSlotId", protect, ctrl.updateSlot);

/**
 * @desc   Zaman aralığını sil
 * @route  DELETE /api/slots/:teacherId/timeslots/:timeSlotId
 * @access Private (Teacher)
 */
router.delete("/:teacherId/timeslots/:timeSlotId", protect, ctrl.deleteSlot);

export default router;