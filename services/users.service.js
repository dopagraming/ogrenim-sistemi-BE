// services/admin.service.js
import bcrypt from "bcryptjs";
import Teacher from "../models/teacherModel.js";
import MasterStudent from "../models/masterStudentModel.js"; // make sure path/name is correct in your app

const SALT_ROUNDS = 10;

// unify DB docs to a single shape for frontend
const shapeUser = (doc, role) => {
    if (!doc) return null;
    const base = {
        _id: doc._id,
        role,
        displayName: doc.displayName || doc.name || "",
        email: doc.email,
        phone: doc.phone || "",
        createdAt: doc.createdAt,
    };

    if (role === "teacher") {
        return {
            ...base,
            department: doc.department || "",
            office: doc.office || "",
            photoURL: doc.photoURL || "",
        };
    }
    // student
    return {
        ...base,
        department: "", // not applicable
        office: "",
        teacher: doc.teacher || null, // advisor id if you store it
    };
};

export const listUsers = async ({ q = "", role = "", page = 1, pageSize = 20 }) => {
    const p = Math.max(1, Number(page) || 1);
    const s = Math.min(100, Math.max(1, Number(pageSize) || 20));
    const text = String(q || "").trim();

    // build regex filter for name/email/department
    const reg = text ? new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : null;

    const teacherFilter = reg
        ? { $or: [{ displayName: reg }, { email: reg }, { department: reg }] }
        : {};
    const studentFilter = reg
        ? { $or: [{ name: reg }, { displayName: reg }, { email: reg }] }
        : {};

    const wantTeacher = !role || role === "teacher";
    const wantStudent = !role || role === "student";

    let teachers = [];
    let students = [];

    if (wantTeacher) {
        teachers = await Teacher.find(teacherFilter)
            .sort({ createdAt: -1 })
            .lean();
    }
    // if (wantStudent) {
    //     students = await MasterStudent.find(studentFilter)
    //         .sort({ createdAt: -1 })
    //         .lean();
    // }

    const merged = [
        ...teachers.map((t) => shapeUser(t, "teacher")),
        ...students.map((s) => shapeUser(s, "student")),
    ]
        .filter(Boolean)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = merged.length;
    const start = (p - 1) * s;
    const items = merged.slice(start, start + s);

    return { items, total, page: p, pageSize: s };
};

export const createUser = async (payload) => {
    const role = String(payload.role || "").toLowerCase();
    if (!["teacher", "student"].includes(role)) {
        const err = new Error("Geçersiz rol.");
        err.statusCode = 400;
        throw err;
    }

    if (!payload.email || !payload.displayName) {
        const err = new Error("Ad soyad ve e-posta zorunludur.");
        err.statusCode = 400;
        throw err;
    }

    if (role === "teacher") {
        const exists = await Teacher.findOne({ email: payload.email });
        if (exists) {
            const err = new Error("Bu e-posta zaten kayıtlı (öğretmen).");
            err.statusCode = 409;
            throw err;
        }

        const doc = new Teacher({
            displayName: payload.displayName,
            email: payload.email,
            password: payload.password || Math.random().toString(36).slice(2, 10),
            department: payload.department || "",
            office: payload.office || "",
            phone: payload.phone || "",
            photoURL: payload.photoURL || "",
        });

        const saved = await doc.save();
        return shapeUser(saved.toObject(), "teacher");
    }

    // student
    const exists = await MasterStudent.findOne({ email: payload.email });
    if (exists) {
        const err = new Error("Bu e-posta zaten kayıtlı (öğrenci).");
        err.statusCode = 409;
        throw err;
    }

    let hashed = "";
    if (payload.password) {
        hashed = await bcrypt.hash(payload.password, SALT_ROUNDS);
    }

    const sdoc = await MasterStudent.create({
        name: payload.displayName,
        displayName: payload.displayName,
        email: payload.email,
        password: hashed,
        teacher: payload.teacher || null,
    });

    return shapeUser(sdoc.toObject(), "student");
};

export const updateUser = async (id, payload) => {
    const role = String(payload.role || "").toLowerCase();
    if (!["teacher", "student"].includes(role)) {
        const err = new Error("Güncelleme için rol gereklidir.");
        err.statusCode = 400;
        throw err;
    }

    if (role === "teacher") {
        const t = await Teacher.findById(id);
        if (!t) {
            const err = new Error("Öğretmen bulunamadı.");
            err.statusCode = 404;
            throw err;
        }

        if (payload.displayName !== undefined) t.displayName = payload.displayName;
        if (payload.email !== undefined) t.email = payload.email;
        if (payload.department !== undefined) t.department = payload.department;
        if (payload.office !== undefined) t.office = payload.office;
        if (payload.phone !== undefined) t.phone = payload.phone;
        if (payload.photoURL !== undefined) t.photoURL = payload.photoURL;
        if (payload.password) t.password = payload.password;

        const u = await t.save();
        return shapeUser(u.toObject(), "teacher");
    }

    const s = await MasterStudent.findById(id);
    if (!s) {
        const err = new Error("Öğrenci bulunamadı.");
        err.statusCode = 404;
        throw err;
    }

    if (payload.displayName !== undefined) {
        s.displayName = payload.displayName;
        s.name = payload.displayName;
    }
    if (payload.email !== undefined) s.email = payload.email;
    if (payload.teacher !== undefined) s.teacher = payload.teacher; // advisor
    if (payload.password) {
        s.password = await bcrypt.hash(payload.password, SALT_ROUNDS);
    }

    const u = await s.save();
    return shapeUser(u.toObject(), "student");
};

export const deleteUser = async (id, role) => {
    if (role !== "admin") {
        const err = new Error("Silmek için rol gereklidir.");
        err.statusCode = 400;
        throw err;
    }
    const doc = await Teacher.findById(id);
    if (!doc) return false;
    await doc.deleteOne();
    return true;
};
