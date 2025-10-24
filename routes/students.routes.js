import express from "express";
import expressAsyncHandler from "express-async-handler";
import * as ctrl from "../controllers/students.controller.js";

const router = express.Router();

/**
 * @desc   Öğrenci numarasıyla kontrol
 * @route  GET /api/students/check?number=XXXX
 * @access Public
 */
router.get("/check", expressAsyncHandler(ctrl.checkByNumber));

/**
 * @desc   Davet token ile şifre oluşturma
 * @route  POST /api/students/create-password
 * @access Public (token zorunlu)
 */
router.post("/create-password", expressAsyncHandler(ctrl.createPassword));

/**
 * @desc   MasterStudent girişi
 * @route  POST /api/students/login
 * @access Public
 */
router.post("/login", expressAsyncHandler(ctrl.loginMasterStudent));

/**
 * @desc   Tüm MasterStudent kayıtları
 * @route  GET /api/students/masterstudents
 * @access Private (isteğe göre koruma eklenebilir)
 */
router.get("/masterstudents", expressAsyncHandler(ctrl.listMasterStudents));

export default router;
