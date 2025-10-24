import Teacher from "../models/teacherModel.js";
import Student from "../models/studentModel.js";
import nodemailer from "nodemailer"
import xlsx from "xlsx";
import MasterStundent from "../models/masterStudentModel.js";
import crypto from "crypto"
import Invitation from "../models/invitationModel.js";
export const findTeacherById = async (id) => {
    return Teacher.findById(id).select("-password");
};

/**
 * List teachers with optional search/pagination
 * @param {Object} opts
 * @param {string} [opts.q]
 * @param {number} [opts.page=1]
 * @param {number} [opts.pageSize=12]
 * @param {boolean} [opts.includeCounts=false] whether to include studentsCount via $lookup (example)
 */

const escapeRegex = (s = '') => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export async function listTeachers({
    q = '',
    page = 1,
    pageSize = 12,
    includeCounts = false, 
    faculty = '',
    department = '',
}) {
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const s = Math.min(Math.max(parseInt(pageSize, 10) || 12, 1), 100);

    const match = {};

    if (faculty && faculty.trim()) {
        match.faculty_lc = (faculty || '').toLowerCase();
    }
    if (department && department.trim()) {
        match.department_lc = (department || '').toLowerCase();
    }

    if (q && q.trim()) {
        const qlc = q.toLowerCase();
        const rx = new RegExp(escapeRegex(qlc)); 
        match.$or = [
            { displayName_lc: rx },
            { department_lc: rx },
            { email_lc: rx },
            { faculty_lc: rx },
        ];
    }

    const total = await Teacher.countDocuments(match);
    const items = await Teacher.find(match)
        .sort(q ? { displayName_lc: 1 } : { createdAt: -1 })
        .skip((p - 1) * s)
        .limit(s)
        .lean();

    return { items, total, page: p, pageSize: s };
}



export const deleteTeacherOwned = async ({ teacherId, requesterId }) => {
    const t = await Teacher.findById(teacherId);
    if (!t) return { exists: false, allowed: true };
    const allowed = String(t._id) === String(requesterId);
    if (!allowed) return { exists: true, allowed: false };
    await t.deleteOne();
    return { exists: true, allowed: true };
};

// ---- Excel içe aktarma ----
const normalizeHeader = (s = "") => String(s).toLowerCase().replace(/[\s_-]+/g, "").trim();
const NAME_HEADERS = new Set(["name", "studentname", "fullname"]);
const NUMBER_HEADERS = new Set(["number", "studentnumber", "id", "studentid"]);

export const importStudentsFromXlsx = async (filePath) => {
    const wb = xlsx.readFile(filePath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, raw: false });

    if (!rows.length) throw new Error("Dosya boş.");

    const headerRow = rows[0].map(normalizeHeader);
    const nameIdx = headerRow.findIndex((h) => NAME_HEADERS.has(h));
    const numberIdx = headerRow.findIndex((h) => NUMBER_HEADERS.has(h));

    if (nameIdx === -1 || numberIdx === -1) {
        throw new Error(
            "Başlıklar eksik. Gerekli başlıklar: 'name' ve 'number' (büyük/küçük harf duyarsız)."
        );
    }

    const results = { added: [], skipped: [] };

    for (let r = 1; r < rows.length; r++) {
        const row = rows[r] || [];
        const nameRaw = row[nameIdx];
        const numberRaw = row[numberIdx];
        if (nameRaw == null && numberRaw == null) continue;

        const name = String(nameRaw || "").trim().toLowerCase();
        const number = String(numberRaw || "").trim();
        if (!name || !number) continue;

        const exists = await Student.findOne({ number });
        if (exists) {
            results.skipped.push(number);
        } else {
            await Student.create({ number, name });
            results.added.push(number);
        }
    }
    return results;
};

const VALID_LEVELS = ["lisans", "yukseklisans"];

export const getBookingOptions = async (teacherId, level) => {
    const t = await Teacher.findById(teacherId).lean();
    console.log(t)
    if (!t) throw new Error("not found");
    const options = t.bookingOptions || { lisans: [], yukseklisans: [] };
    console.log(options)
    console.log(level)
    if (level) {
        if (!VALID_LEVELS.includes(level)) {
            return [];
        }
        const arr = Array.isArray(options[level]) ? options[level] : [];
        return arr;
    }
    return options;
};

export const updateBookingOptions = async (teacherId, payload) => {
    const t = await Teacher.findById(teacherId);
    if (!t) throw new Error("not found");
    t.bookingOptions = {
        lisans: Array.isArray(payload?.lisans) ? payload.lisans : [],
        yukseklisans: Array.isArray(payload?.yukseklisans) ? payload.yukseklisans : [],
    };
    await t.save();
    return t.bookingOptions;
};


const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
        user: "blog@abdelrahmanzourob.com",
        pass: "YLKCDt123$",
    },
    tls: { rejectUnauthorized: false },
});

export const addStudentAndInvite = async ({ teacherId, name, email }) => {
    const existing = await MasterStundent.findOne({ email });
    if (existing) {
        const err = new Error("Öğrenci zaten kayıtlı.");
        err.statusCode = 400;
        throw err;
    }

    await MasterStundent.create({ name, email, password: null, teacher: teacherId });

    const token = crypto.randomBytes(20).toString("hex");
    await Invitation.create({
        email,
        token,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    const baseUrl = process.env.FRONTEND_BASE_URL || "http://localhost:3000";
    const emailSubject = "Makale erişimi için şifre oluşturun";
    const setupLink = `${baseUrl}/create-password?token=${token}`;

    const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; background-color: #f9f9f9; border-radius: 10px; border: 1px solid #ddd;">
      <h2 style="text-align: center; color: #28a745;">${emailSubject}</h2>
      <p style="font-size: 16px; color: #333;">Merhaba <strong>${name}</strong>,</p>
      <p>Lütfen aşağıdaki bağlantıya tıklayarak şifrenizi oluşturun:</p>
      <p><a href="${setupLink}" style="text-decoration:none;">Şifre Oluştur</a></p>
      <p>Eğer bu talebi siz başlatmadıysanız, lütfen bu e-postayı yok sayın.</p>
    </div>
  `;

    await transporter.sendMail({
        from: "blog@abdelrahmanzourob.com",
        to: email,
        subject: emailSubject,
        html: emailHtml,
    });

    return true;
};
