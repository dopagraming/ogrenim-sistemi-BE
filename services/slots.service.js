import TimeSlot from "../models/timeSlotModel.js";

function parseHHMMOrThrow(s) {
    const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(s || "");
    if (!m) throw new Error("Saat HH:mm biçiminde olmalıdır (00:00–23:59).");
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    return h * 60 + min;
}

function overlapQuery(teacherId, dayOfWeek, startM, endM, excludeId) {
    const base = {
        teacher: teacherId,
        dayOfWeek,
        startMinutes: { $lt: endM }, // start < other.end
        endMinutes: { $gt: startM }, // other.start < end
    };
    const and = [base];
    if (excludeId) and.push({ _id: { $ne: excludeId } });
    return { $and: and };
}

export const createSlot = async ({ teacherId, dayOfWeek, startTime, endTime, studentsNumber = 1, isBooked = false }) => {
    const startMinutes = parseHHMMOrThrow(startTime);
    const endMinutes = parseHHMMOrThrow(endTime);
    if (endMinutes <= startMinutes) {
        const err = new Error("endTime, startTime'dan sonra olmalıdır.");
        err.statusCode = 400;
        throw err;
    }

    const day = String(dayOfWeek).toLowerCase();

    const conflict = await TimeSlot.findOne(overlapQuery(teacherId, day, startMinutes, endMinutes));
    if (conflict) {
        const err = new Error("Aynı gün içinde mevcut bir zaman aralığıyla çakışıyor.");
        err.statusCode = 409;
        throw err;
    }

    return TimeSlot.create({
        teacher: teacherId,
        dayOfWeek: day,
        startTime,
        endTime,
        startMinutes,
        endMinutes,
        isBooked: Boolean(isBooked),
        studentsNumber: Number(studentsNumber) ?? 1,
    });
};

export const getSlots = async (teacherId) => {
    return TimeSlot.find({ teacher: teacherId }).sort({ dayOfWeek: 1, startMinutes: 1 });
};

export const getSlotById = async (timeSlotId) => {
    return TimeSlot.findById(timeSlotId);
};

export const updateSlot = async ({ teacherId, timeSlotId, body }) => {
    const current = await TimeSlot.findById(timeSlotId);
    if (!current) {
        const err = new Error("Zaman aralığı bulunamadı.");
        err.statusCode = 404;
        throw err;
    }

    // (İsteğe bağlı) sahiplik kontrolü
    if (String(current.teacher) !== String(teacherId)) {
        const err = new Error("Bu kaynağa erişim izniniz yok.");
        err.statusCode = 403;
        throw err;
    }

    const dayOfWeek = String(body.dayOfWeek ?? current.dayOfWeek).toLowerCase();
    const startTime = body.startTime ?? current.startTime;
    const endTime = body.endTime ?? current.endTime;

    const startMinutes = parseHHMMOrThrow(startTime);
    const endMinutes = parseHHMMOrThrow(endTime);
    if (endMinutes <= startMinutes) {
        const err = new Error("endTime, startTime'dan sonra olmalıdır.");
        err.statusCode = 400;
        throw err;
    }

    const conflict = await TimeSlot.findOne(
        overlapQuery(teacherId, dayOfWeek, startMinutes, endMinutes, timeSlotId)
    );
    if (conflict) {
        const err = new Error("Aynı gün içinde mevcut bir zaman aralığıyla çakışıyor.");
        err.statusCode = 409;
        throw err;
    }

    current.dayOfWeek = dayOfWeek;
    current.startTime = startTime;
    current.endTime = endTime;
    current.startMinutes = startMinutes;
    current.endMinutes = endMinutes;

    if (typeof body.isBooked === "boolean") current.isBooked = body.isBooked;
    if (typeof body.studentsNumber === "number") current.studentsNumber = body.studentsNumber;

    return current.save();
};

export const deleteSlot = async (timeSlotId) => {
    const doc = await TimeSlot.findById(timeSlotId);
    if (!doc) return false;
    await doc.deleteOne();
    return true;
};

export const getAvailableSlots = async (teacherId) => {
    return TimeSlot.find({
        teacher: teacherId,
        isBooked: { $ne: true },
        studentsNumber: { $gt: 0 },
    }).sort({ dayOfWeek: 1, startMinutes: 1 });
};
