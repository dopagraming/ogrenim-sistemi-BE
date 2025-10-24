import asyncHandler from "express-async-handler";
import * as svc from "../services/appointments.service.js";

/**
 * @desc   Yeni randevu oluştur
 * @route  POST /api/appointments
 * @access Public
 */
export const createNewAppointment = asyncHandler(async (req, res) => {
    const created = await svc.createNewAppointment(req.body);
    return res.status(201).json(created);
});

/**
 * @desc   Öğretmenin randevularını listele
 * @route  GET /api/appointments/teacher
 * @access Private (Teacher)
 */
export const getAppointments = asyncHandler(async (req, res) => {
    const list = await svc.getAppointments(req.teacher._id);
    return res.status(200).json(list);
});

/**
 * @desc   Randevu durumunu güncelle (accepted/rejected)
 * @route  PUT /api/appointments/:id/status
 * @access Private (Teacher)
 */
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
    const updated = await svc.updateAppointmentStatus({
        appointmentId: req.params.id,
        teacherId: req.teacher._id,
        nextStatus: req.body.status,
        teacherDisplayName: req.teacher.displayName,
    });
    return res.status(200).json(updated);
});

/**
 * @desc   Randevuyu başka slot’a taşı (kapasite kontrolü ile)
 * @route  PUT /api/appointments/:id/move
 * @access Private (Teacher)
 */
export const moveAppointment = asyncHandler(async (req, res) => {
    const saved = await svc.moveAppointment({
        appointmentId: req.params.id,
        teacherId: req.teacher._id,
        toSlotId: req.body.toSlotId,
        teacherDisplayName: req.teacher.displayName,
    });
    return res.status(200).json(saved);
});

/**
 * @desc   Randevuyu sil
 * @route  DELETE /api/appointments/:id
 * @access Private (Teacher)
 */
export const deleteAppointment = asyncHandler(async (req, res) => {
    await svc.deleteAppointment({ appointmentId: req.params.id, teacherId: req.teacher._id });
    return res.status(200).json({ message: "Randevu silindi." });
});

/**
 * @desc   Öğretmen için yaklaşan randevular
 * @route  GET /api/appointments/teacher/upcoming
 * @access Private (Teacher)
 */
export const getUpcomingAppointmentsByTeacher = asyncHandler(async (req, res) => {
    const { teacherId, limit } = req.query;
    const data = await svc.getUpcomingAppointmentsByTeacher({ teacherId, limit });
    return res.status(200).json(data);
});

/**
 * @desc   Randevu sayım istatistikleri
 * @route  GET /api/appointments/stats
 * @access Public
 */
export const getBookingCountStats = asyncHandler(async (req, res) => {
    const { teacherId } = req.query;
    const stats = await svc.getBookingCountStats(teacherId);
    return res.status(200).json(stats);
});


export const moveDay = async (req, res) => {
    const { _id } = req.teacher;
    const teacherId = _id
    const { fromDay, toDay, createMissingSlots = true } = req.body;

    const out = await svc.moveDayAppointments({
        teacherId,
        fromDay,
        toDay,
        createMissingSlots,
    });
    res.json(out);
};