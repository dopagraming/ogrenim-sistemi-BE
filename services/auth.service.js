import jwt from "jsonwebtoken";
import Teacher from "../models/teacherModel.js";
import MasterStudent from "../models/masterStudentModel.js";

const norm = (v) => (typeof v === "string" ? v.trim() : v);
const toLc = (v) => (typeof v === "string" ? v.trim().toLowerCase() : v);

const signToken = (id, role) =>
    jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });

/**
 * @desc   Yeni öğretmen oluştur ve token döndür
 * @note   Var olan e-posta kontrolü yapılır
 */
export const registerTeacher = async ({ displayName, email, password, role }) => {
    const exists = await Teacher.findOne({ email });
    if (exists) {
        const err = new Error("Bu e-posta ile kayıtlı öğretmen zaten var.");
        err.statusCode = 400;
        throw err;
    }

    const teacher = await Teacher.create({ displayName, email, password, role });
    if (!teacher) {
        const err = new Error("Geçersiz öğretmen verisi.");
        err.statusCode = 400;
        throw err;
    }

    return {
        _id: teacher._id,
        displayName: teacher.displayName,
        email: teacher.email,
        role: teacher.role,
        token: signToken(teacher._id, teacher.role),
    };
};

/**
 * @desc   Kullanıcı girişi (öğretmen/öğrenci) ve JWT üretimi
 * @note   Modellerde matchPassword beklenir
 */
export const login = async ({ email, password, role }) => {
    const r = String(role || "").toLowerCase();
    if (!["teacher", "student"].includes(r)) {
        const err = new Error("Geçersiz rol.");
        err.statusCode = 400;
        throw err;
    }

    const user =
        r === "teacher"
            ? await Teacher.findOne({ email })
            : await MasterStudent.findOne({ email });

    if (!user) {
        const err = new Error("E-posta veya şifre hatalı.");
        err.statusCode = 401;
        throw err;
    }

    const ok =
        typeof user.matchPassword === "function"
            ? await user.matchPassword(password)
            : false;

    if (!ok) {
        const err = new Error("E-posta veya şifre hatalı.");
        err.statusCode = 401;
        throw err;
    }

    return {
        _id: user._id,
        name: user.displayName || user.name,
        email: user.email,
        role: user.role || r,
        token: signToken(user._id, r),
        ...(r === "student" ? { teacher: user.teacher } : {}),
    };
};

/**
 * @desc   Öğretmen profilini getir (DB’den)
 */
export const getTeacherProfile = async (teacherId) => {
    const t = await Teacher.findById(teacherId);
    if (!t) {
        const err = new Error("Öğretmen bulunamadı.");
        err.statusCode = 404;
        throw err;
    }

    return {
        _id: t._id,
        displayName: t.displayName,
        email: t.email,
        photoURL: t.photoURL,
        faculty: t.faculty || "",
        department: t.department,
        office: t.office,
        phone: t.phone,
        bio: t.bio,
        scholarUserId: t.scholarUserId || "",
        scholarProfileUrl: t.scholarProfileUrl || "",
        bookingOptions: t.bookingOptions || undefined,
    };
};

/**
 * @desc   Öğretmen profilini güncelle ve yeni token döndür
 */
export const updateTeacherProfile = async (teacherId, body) => {
    const t = await Teacher.findById(teacherId);
    if (!t) {
        const err = new Error("Öğretmen bulunamadı.");
        err.statusCode = 404;
        throw err;
    }

    // Do NOT allow changing email here (usually managed elsewhere)
    // t.email = body.email ?? t.email;

    if ("displayName" in body) t.displayName = norm(body.displayName);
    if ("photoURL" in body) t.photoURL = norm(body.photoURL);
    if ("faculty" in body) t.faculty = norm(body.faculty);
    if ("department" in body) t.department = norm(body.department);
    if ("office" in body) t.office = norm(body.office);
    if ("phone" in body) t.phone = norm(body.phone);
    if ("bio" in body) t.bio = norm(body.bio);
    if ("scholarProfileUrl" in body) t.scholarProfileUrl = norm(body.scholarProfileUrl);
    if ("scholarUserId" in body) t.scholarUserId = norm(body.scholarUserId);

    if ("bookingOptions" in body && body.bookingOptions && typeof body.bookingOptions === "object") {
        t.bookingOptions = {
            lisans: Array.isArray(body.bookingOptions.lisans) ? body.bookingOptions.lisans : (t.bookingOptions?.lisans || []),
            yukseklisans: Array.isArray(body.bookingOptions.yukseklisans) ? body.bookingOptions.yukseklisans : (t.bookingOptions?.yukseklisans || []),
        };
    }

    t.displayName_lc = toLc(t.displayName);
    t.department_lc = toLc(t.department);
    t.faculty_lc = toLc(t.faculty);

    if (body.password && String(body.password).trim()) {
        t.password = String(body.password);
    }

    const u = await t.save();

    return {
        _id: u._id,
        displayName: u.displayName,
        email: u.email,
        photoURL: u.photoURL,
        faculty: u.faculty || "",
        department: u.department,
        office: u.office,
        phone: u.phone,
        bio: u.bio,
        scholarUserId: u.scholarUserId || "",
        scholarProfileUrl: u.scholarProfileUrl || "",
        bookingOptions: u.bookingOptions || undefined,
        token: signToken(u._id, "teacher"),
    };
};

/** @desc  Dış kullanım için generateToken alias'ı */
export const generateToken = (id, role) => signToken(id, role);
