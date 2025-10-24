// src/services/appointments.service.js
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import Appointment from "../models/appointmentModel.js";
import TimeSlot from "../models/timeSlotModel.js";

/* =========================================================
 *  Mail gönderici (ENV üzerinden)
 * ======================================================= */
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.hostinger.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false },
});

const sendMailSafe = async (opts) => {
    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            ...opts,
        });
    } catch (e) {
        // Sessiz geç – logla ama akışı bozma
        console.error("Mail gönderilemedi:", e.message);
    }
};

/* =========================================================
 *  Yardımcılar
 * ======================================================= */

const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];

/** @returns {"monday"|"tuesday"|"wednesday"|"thursday"|"friday"} */
function normDay(d) {
    const v = String(d || "").trim().toLowerCase();
    if (!WEEKDAYS.includes(v)) {
        const err = new Error("Geçersiz gün adı (sadece monday..friday).");
        err.statusCode = 400;
        throw err;
    }
    return v;
}

/** "HH:mm" -> dakika */
function toMinutes(hhmm) {
    const [h, m] = String(hhmm || "00:00").split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
}

/* =========================================================
 *  Randevu Servisleri
 * ======================================================= */

/**
 * @desc   Yeni randevu oluşturur. Aynı öğrencinin aktif "pending" randevusu varsa engeller.
 * @param  {Object} body
 * @returns {Promise<Appointment>}
 */
export const createNewAppointment = async (body) => {
    const {
        teacher,
        studentName,
        studentNumber,
        studentEmail,
        studentPhone,
        studentMajor,
        endTime,
        startTime,
        notes,
        userType,
        educationLevel,
        slotId: timeSlot,
    } = body;

    // Aynı öğrenci numarasıyla bekleyen randevu var mı?
    const hasPending = await Appointment.findOne({
        studentNumber,
        status: "pending",
    });

    if (hasPending) {
        const err = new Error(
            `${studentName}, aktif bir randevunuz var. Lütfen öğretmenin e-posta yanıtını bekleyin.`
        );
        err.statusCode = 400;
        throw err;
    }

    const doc = await Appointment.create({
        teacher,
        studentName,
        studentNumber,
        studentEmail,
        studentPhone,
        studentMajor,
        endTime,
        startTime,
        notes,
        timeSlot,
        userType,
        status: "pending",
        educationLevel,
    });

    if (!doc) {
        const err = new Error("Geçersiz randevu verisi.");
        err.statusCode = 400;
        throw err;
    }

    return doc;
};

/**
 * @desc   Öğretmenin tüm randevularını getirir (en yakından eskiye doğru).
 * @param  {string|mongoose.Types.ObjectId} teacherId
 * @returns {Promise<Appointment[]>}
 */
export const getAppointments = async (teacherId) => {
    return Appointment.find({ teacher: teacherId }).sort({ startTime: 1 });
};

/**
 * @desc   Randevu durumunu günceller. "accepted" olduğunda slot kapasitesini düşürür ve bilgilendirme maili yollar.
 * @param  {Object} params
 * @param  {string} params.appointmentId
 * @param  {string} params.teacherId
 * @param  {string} params.nextStatus   "accepted" | "pending" | "rejected"
 * @param  {string} params.teacherDisplayName
 * @returns {Promise<Appointment>}
 */
export const updateAppointmentStatus = async ({
    appointmentId,
    teacherId,
    nextStatus,
    teacherDisplayName,
}) => {
    const ap = await Appointment.findById(appointmentId);
    if (!ap) {
        const err = new Error("Randevu bulunamadı.");
        err.statusCode = 404;
        throw err;
    }
    if (String(ap.teacher) !== String(teacherId)) {
        const err = new Error("Bu randevuyu güncelleme yetkiniz yok.");
        err.statusCode = 401;
        throw err;
    }

    // Kabul ediliyorsa kapasiteyi düşür (studentsNumber -> kalan koltuk sayısı)
    if (nextStatus === "accepted") {
        const slot = await TimeSlot.findById(ap.timeSlot);
        if (!slot) {
            const err = new Error(`Zaman aralığı bulunamadı: ${ap.timeSlot}`);
            err.statusCode = 404;
            throw err;
        }
        if (slot.isBooked || (slot.studentsNumber ?? 0) <= 0) {
            const err = new Error("Bu zaman aralığı dolu.");
            err.statusCode = 409;
            throw err;
        }
        slot.studentsNumber -= 1;
        if (slot.studentsNumber <= 0) slot.isBooked = true;
        await slot.save();
    }

    ap.status = nextStatus;
    const updated = await ap.save();

    // Mail bildirimi
    const apTime = new Date(ap.startTime).toLocaleString();
    const accepted = nextStatus === "accepted";

    await sendMailSafe({
        to: ap.studentEmail,
        subject: accepted ? "Randevunuz Onaylandı" : "Randevunuz Onaylanmadı",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; background-color: #f9f9f9; border-radius: 10px; border: 1px solid #ddd;">
        <h2 style="text-align: center; color:${accepted ? "#28a745" : "#dc3545"};">
          ${accepted ? "Randevu Onayı" : "Randevu Durumu"}
        </h2>
        <p>Merhaba <strong>${ap.studentName}</strong>,</p>
        <p>
          <strong>${teacherDisplayName}</strong> ile <strong>${apTime}</strong> tarihli randevunuz <strong>${accepted ? "onaylandı" : "onaylanmadı"}</strong>.
        </p>
        <p>${accepted ? "Lütfen zamanında olun." : "Uygun bir zamanda yeni randevu oluşturabilirsiniz."}</p>
        <p style="font-size:12px;color:#aaa;text-align:center;margin-top:40px;">Bu e-posta otomatik gönderilmiştir.</p>
      </div>
    `,
    });

    return updated;
};

/**
 * @desc   Randevuyu siler (öğretmen sahiplik kontrolü ile).
 * @param  {Object} params
 * @param  {string} params.appointmentId
 * @param  {string} params.teacherId
 * @returns {Promise<void>}
 */
export const deleteAppointment = async ({ appointmentId, teacherId }) => {
    const ap = await Appointment.findById(appointmentId);
    if (!ap) {
        const err = new Error("Randevu bulunamadı.");
        err.statusCode = 404;
        throw err;
    }
    if (String(ap.teacher) !== String(teacherId)) {
        const err = new Error("Bu randevuyu silme yetkiniz yok.");
        err.statusCode = 401;
        throw err;
    }
    await ap.deleteOne();
};

/**
 * @desc   Öğretmen için yaklaşan randevuları döndürür.
 * @param  {Object} params
 * @param  {string} params.teacherId
 * @param  {number} [params.limit=5]
 * @returns {Promise<Appointment[]>}
 */
export const getUpcomingAppointmentsByTeacher = async ({
    teacherId,
    limit = 5,
}) => {
    if (!teacherId) {
        const err = new Error("teacherId zorunludur.");
        err.statusCode = 400;
        throw err;
    }
    const now = new Date();
    return Appointment.find({ teacher: teacherId, startTime: { $gte: now } })
        .sort({ startTime: 1 })
        .limit(Number(limit));
};

/**
 * @desc   Öğretmen bazında randevu sayım istatistiklerini döndürür.
 * @param  {string} teacherId
 * @returns {Promise<{total:number,accepted:number,pending:number,rejected:number}>}
 */
export const getBookingCountStats = async (teacherId) => {
    if (!teacherId) {
        const err = new Error("teacherId zorunludur.");
        err.statusCode = 400;
        throw err;
    }

    const [total, accepted, pending, rejected] = await Promise.all([
        Appointment.countDocuments({ teacher: teacherId }),
        Appointment.countDocuments({ teacher: teacherId, status: "accepted" }),
        Appointment.countDocuments({ teacher: teacherId, status: "pending" }),
        Appointment.countDocuments({ teacher: teacherId, status: "rejected" }),
    ]);

    return { total, accepted, pending, rejected };
};

/**
 * @desc   Tek bir randevuyu başka bir slot’a taşır ve "accepted" yapar (studentsNumber/isBooked kapasite kontrolüyle).
 * @param  {Object} params
 * @param  {string} params.appointmentId
 * @param  {string} params.teacherId
 * @param  {string} params.toSlotId
 * @param  {string} params.teacherDisplayName
 * @returns {Promise<Appointment>}
 */
export const moveAppointment = async ({
    appointmentId,
    teacherId,
    toSlotId,
    teacherDisplayName,
}) => {
    if (!toSlotId) {
        const err = new Error("toSlotId zorunludur.");
        err.statusCode = 400;
        throw err;
    }

    const ap = await Appointment.findById(appointmentId);
    if (!ap) {
        const err = new Error("Randevu bulunamadı.");
        err.statusCode = 404;
        throw err;
    }
    if (String(ap.teacher) !== String(teacherId)) {
        const err = new Error("Bu randevuyu taşıma yetkiniz yok.");
        err.statusCode = 401;
        throw err;
    }

    const sameSlot = String(ap.timeSlot || "") === String(toSlotId || "");
    const fromSlot = sameSlot ? null : await TimeSlot.findById(ap.timeSlot);
    const toSlot = await TimeSlot.findById(toSlotId);

    if (!toSlot) {
        const err = new Error("Hedef zaman aralığı bulunamadı.");
        err.statusCode = 404;
        throw err;
    }
    if (String(toSlot.teacher) !== String(teacherId)) {
        const err = new Error("Hedef slot bu öğretmene ait değil.");
        err.statusCode = 401;
        throw err;
    }

    // Önceden accepted ve farklı slot’a gidiyorsa: eski slotta yer iade et
    if (!sameSlot && ap.status === "accepted" && fromSlot) {
        fromSlot.studentsNumber = Math.max(
            0,
            (fromSlot.studentsNumber || 0) + 1
        );
        if (fromSlot.studentsNumber > 0) fromSlot.isBooked = false;
        await fromSlot.save();
    }

    // Yeni slota yer ayır (accepted’a çekerken kapasite düş)
    const needsCapacity = !(sameSlot && ap.status === "accepted");
    if (needsCapacity) {
        if (toSlot.isBooked || (toSlot.studentsNumber ?? 0) <= 0) {
            const err = new Error("Hedef slot dolu.");
            err.statusCode = 409;
            throw err;
        }
        toSlot.studentsNumber -= 1;
        if (toSlot.studentsNumber <= 0) toSlot.isBooked = true;
        await toSlot.save();
    }

    // Taşı ve accepted yap
    ap.timeSlot = toSlotId;
    ap.startTime = toSlot.startTime; // Randevu metin alanıysa hedef slot saatlerini yansıt
    ap.endTime = toSlot.endTime;
    ap.status = "accepted";

    const saved = await ap.save();

    // Mail bildirimi
    const apTimeStr = `${toSlot.dayOfWeek} ${toSlot.startTime}-${toSlot.endTime}`;
    await sendMailSafe({
        to: saved.studentEmail,
        subject: "Randevunuz taşındı ve onaylandı",
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; background-color: #f9f9f9; border-radius: 10px; border: 1px solid #ddd;">
        <h2 style="text-align:center;color:#28a745;">Randevu Onayı</h2>
        <p>Merhaba <strong>${saved.studentName}</strong>,</p>
        <p>
          <strong>${teacherDisplayName}</strong> ile randevunuz taşındı ve <strong>onaylandı</strong>.<br/>
          Yeni zaman: <strong>${apTimeStr}</strong>
        </p>
        <p>Lütfen zamanında olun.</p>
        <p style="font-size:12px;color:#aaa;text-align:center;margin-top:40px;">Bu e-posta otomatik gönderilmiştir.</p>
      </div>
    `,
    });

    return saved;
};

/**
 * @desc   Bir öğretmenin BELİRLİ bir gündeki TÜM randevularını başka bir güne taşır.
 *         Eşleşen hedef slot (startTime-endTime) yoksa isteğe bağlı olarak yeni slot oluşturur.
 *         Not: Burada kapasite "studentsNumber" alanı üzerinden sıkı denetlenmez; toplu taşıma yapılır.
 * @param  {Object} params
 * @param  {string|mongoose.Types.ObjectId} params.teacherId
 * @param  {string} params.fromDay  "monday".."friday"
 * @param  {string} params.toDay    "monday".."friday"
 * @param  {boolean} [params.createMissingSlots=true]  Eksik hedef slotları otomatik oluştur
 * @returns {Promise<{success:boolean,moved:number,skipped:number,createdSlots:number,message:string}>}
 */
export const moveDayAppointments = async ({
    teacherId,
    fromDay,
    toDay,
    createMissingSlots = true,
}) => {
    const from = normDay(fromDay);
    const to = normDay(toDay);

    // 1) Kaynak günün tüm slotları
    const srcSlots = await TimeSlot.find({
        teacher: teacherId,
        dayOfWeek: from,
    }).lean();
    console.log(srcSlots)
    if (!srcSlots.length) {
        return {
            success: true,
            moved: 0,
            skipped: 0,
            createdSlots: 0,
            message: "Taşınacak zaman dilimi bulunamadı.",
        };
    }

    // 2) Hedef günlük slotları getir ve map hazırla
    const tgtSlots = await TimeSlot.find({
        teacher: teacherId,
        dayOfWeek: to,
    }).lean();

    const keyOf = (s) => `${s.startTime}-${s.endTime}`;
    const tgtMap = new Map(tgtSlots.map((s) => [keyOf(s), s]));

    let moved = 0;
    let skipped = 0;
    let createdSlots = 0;

    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
        for (const src of srcSlots) {
            const k = keyOf(src);
            let tgt = tgtMap.get(k);

            // 3) Eksikse hedef slotu oluştur
            if (!tgt && createMissingSlots) {
                const startMinutes = Number.isFinite(src.startMinutes)
                    ? src.startMinutes
                    : toMinutes(src.startTime);
                const endMinutes = Number.isFinite(src.endMinutes)
                    ? src.endMinutes
                    : toMinutes(src.endTime);

                const created = await TimeSlot.create(
                    [
                        {
                            teacher: teacherId,
                            dayOfWeek: to,
                            startTime: src.startTime,
                            endTime: src.endTime,
                            startMinutes,
                            endMinutes,
                            isBooked: false,
                            studentsNumber: typeof src.studentsNumber === "number" ? src.studentsNumber : 1,
                        },
                    ],
                    { session }
                );

                tgt = created[0].toObject();
                tgtMap.set(k, tgt);
                createdSlots += 1;
            }

            if (!tgt) {
                // Hedefte eşleşen slot yok, oluşturma kapalı -> bu slot’taki randevular taşınamadı (skipped)
                const count = await Appointment.countDocuments({
                    timeSlot: src._id,
                }).session(session);
                skipped += count;
                continue;
            }

            // 4) Bu kaynak slot’a bağlı TÜM randevuları hedef slot’a taşı
            const res = await Appointment.updateMany(
                { timeSlot: src._id },
                { $set: { timeSlot: tgt._id } },
                { session }
            );
            moved += res.modifiedCount || 0;
        }
    });
    session.endSession();

    return {
        success: true,
        moved,
        skipped,
        createdSlots,
        message: "Gün kaydırma işlemi tamamlandı.",
    };
};
