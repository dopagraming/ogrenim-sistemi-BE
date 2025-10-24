import * as svc from "../services/slots.service.js";

/** POST /api/slots/:teacherId/timeslots */
export const createSlot = async (req, res) => {
    try {
        const teacherIdParam = req.params.teacherId;
        if (!teacherIdParam) return res.status(400).json({ message: "teacherId parametresi gereklidir." });

        const { dayOfWeek, startTime, endTime, studentsNumber = 1, isBooked = false } = req.body;
        if (!dayOfWeek || !startTime || !endTime) {
            return res.status(400).json({ message: "dayOfWeek, startTime ve endTime zorunludur." });
        }

        // (İsteğe bağlı) güvenlik: token'daki öğretmen mi?
        if (req.teacher && String(req.teacher._id) !== String(teacherIdParam)) {
            return res.status(403).json({ message: "Bu kaynağa erişim izniniz yok." });
        }

        const slot = await svc.createSlot({
            teacherId: teacherIdParam,
            dayOfWeek,
            startTime,
            endTime,
            studentsNumber,
            isBooked,
        });

        return res.status(201).json(slot);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
};

/** GET /api/slots/:teacherId/timeslots */
export const getSlots = async (req, res) => {
    try {
        const teacherId = req.params.teacherId;
        const slots = await svc.getSlots(teacherId);
        return res.status(200).json(slots);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/** GET /api/slots/:teacherId/timeslots/:timeSlotId */
export const getSlotById = async (req, res) => {
    try {
        const slot = await svc.getSlotById(req.params.timeSlotId);
        if (!slot) return res.status(404).json({ message: "Zaman aralığı bulunamadı." });
        return res.status(200).json(slot);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/** PUT /api/slots/:teacherId/timeslots/:timeSlotId */
export const updateSlot = async (req, res) => {
    try {
        const teacherIdParam = req.params.teacherId;
        const timeSlotId = req.params.timeSlotId;

        if (req.teacher && String(req.teacher._id) !== String(teacherIdParam)) {
            return res.status(403).json({ message: "Bu kaynağa erişim izniniz yok." });
        }

        const saved = await svc.updateSlot({
            teacherId: teacherIdParam,
            timeSlotId,
            body: req.body,
        });

        return res.status(200).json(saved);
    } catch (err) {
        const code = err.statusCode || 400;
        return res.status(code).json({ message: err.message });
    }
};

/** DELETE /api/slots/:teacherId/timeslots/:timeSlotId */
export const deleteSlot = async (req, res) => {
    try {
        const teacherIdParam = req.params.teacherId;
        const timeSlotId = req.params.timeSlotId;

        if (req.teacher && String(req.teacher._id) !== String(teacherIdParam)) {
            return res.status(403).json({ message: "Bu kaynağa erişim izniniz yok." });
        }

        const ok = await svc.deleteSlot(timeSlotId);
        if (!ok) return res.status(404).json({ message: "Zaman aralığı bulunamadı." });
        return res.status(200).json({ message: "Zaman aralığı silindi." });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

/** GET /api/slots/:teacherId/timeslots/available */
export const getAvailableSlots = async (req, res) => {
    try {
        const teacherId = req.params.teacherId;
        const slots = await svc.getAvailableSlots(teacherId);
        return res.status(200).json(slots);
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
};


