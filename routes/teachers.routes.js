import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import * as ctrl from "../controllers/teachers.controller.js";
import multer from "multer"
import { updateProfile } from "../controllers/auth.controller.js";
import expressAsyncHandler from "express-async-handler";
// Mevcut upload mantığın (multer vs) teacherServices içinde ise, route'ları koruduk.

const router = express.Router();

// uploads/
const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (_req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

/**
 * @desc   List teachers (search + pagination)
 * @route  GET /api/teachers?q=&page=&pageSize=&includeCounts=true|false
 * @access Public (adjust if you need auth)
 */
router.get("/", expressAsyncHandler(ctrl.list));

/**
 * @desc   Öğretmen getir / sil
 * @route  GET /api/teachers/:id
 * @route  DELETE /api/teachers/:id
 * @access GET: Public, DELETE: Private (Teacher)
 */
router.route("/:id")
    .get(ctrl.getTeacher)
    .delete(protect, ctrl.deleteTeacher);

/**
 * @desc   Profil güncelle
 * @route  PUT /api/teachers/profile
 * @access Private (Teacher)
 */
router.put("/profile", protect, updateProfile);

/**
 * @desc   Dosya yükle
 * @route  POST /api/teachers/upload
 * @access Private (Teacher)
 */
router.post("/upload", protect, ctrl.uploadFile);

/**
 * @desc   MasterStudent daveti (öğrenci ekle + davet maili)
 * @route  POST /api/teachers/add-student
 * @access Private (Teacher)
 */
router.post("/add-student", protect, ctrl.addStudent);

/**
 * @desc   Randevu/Booking seçenekleri
 * @route  GET  /api/teachers/:id/booking-options
 * @route  PUT  /api/teachers/:id/booking-options
 * @access GET: Public, PUT: Private (Teacher)
 */
router.get("/:id/booking-options", ctrl.getBookingOptions);
router.put("/:id/booking-options", protect, ctrl.updateBookingOptions);

export default router;
