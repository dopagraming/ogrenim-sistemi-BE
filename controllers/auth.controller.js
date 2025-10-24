import asyncHandler from "express-async-handler";
import * as svc from "../services/auth.service.js";

/**
 * @desc   Yeni öğretmen kaydı
 * @route  POST /api/auth/register
 * @access Public
 */
export const register = asyncHandler(async (req, res) => {
    const { displayName, email, password, role = "teacher" } = req.body;
    const out = await svc.registerTeacher({ displayName, email, password, role });
    return res.status(201).json(out);
});

/**
 * @desc   Giriş (öğretmen/öğrenci)
 * @route  POST /api/auth/login
 * @access Public
 */
export const login = asyncHandler(async (req, res) => {
    const { email, password, role } = req.body;
    const out = await svc.login({ email, password, role });
    return res.status(200).json(out);
});

/**
 * @desc   Öğretmen profilini getir
 * @route  GET /api/auth/profile
 * @access Private (Teacher)
 */
export const getProfile = asyncHandler(async (req, res) => {
    const data = await svc.getTeacherProfile(req.teacher._id);
    return res.status(200).json(data);
});

/**
 * @desc   Öğretmen profilini güncelle
 * @route  PUT /api/auth/profile
 * @access Private (Teacher)
 */
export const updateProfile = asyncHandler(async (req, res) => {
    const data = await svc.updateTeacherProfile(req.teacher._id, req.body);
    return res.status(200).json(data);
});
