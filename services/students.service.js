import bcrypt from "bcryptjs";
import Student from "../models/studentModel.js";
import Invitation from "../models/invitationModel.js";
import MasterStudent from "../models/masterStudentModel.js";
import { generateToken } from "../services/auth.service.js";

const SALT_ROUNDS = 10;

export const findStudentByNumber = async (number) => {
    return Student.findOne({ number });
};

export const createPasswordWithInvitation = async ({ token, password }) => {
    const tokenDoc = await Invitation.findOne({ token });
    if (!tokenDoc) {
        const err = new Error("Token geçersiz veya süresi dolmuş.");
        err.statusCode = 400;
        throw err;
    }

    if (tokenDoc.expiresAt < new Date()) {
        await Invitation.deleteOne({ token });
        const err = new Error("Token süresi dolmuş.");
        err.statusCode = 400;
        throw err;
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const updated = await MasterStudent.findOneAndUpdate(
        { email: tokenDoc.email },
        { password: hashed, isActive: true },
        { new: true }
    );

    if (!updated) {
        const err = new Error("Kullanıcı bulunamadı.");
        err.statusCode = 404;
        throw err;
    }

    await Invitation.deleteOne({ token });
    return true;
};

export const loginMasterStudent = async ({ email, password }) => {
    const student = await MasterStudent.findOne({ email });
    if (!student) {
        const err = new Error("E-posta veya şifre hatalı.");
        err.statusCode = 401;
        throw err;
    }

    // Modelinde matchPassword varsa kullan; yoksa bcrypt.compare’a düş.
    let isMatch = false;
    if (typeof student.matchPassword === "function") {
        isMatch = await student.matchPassword(password);
    } else {
        isMatch = await bcrypt.compare(password, student.password || "");
    }

    if (!isMatch) {
        const err = new Error("E-posta veya şifre hatalı.");
        err.statusCode = 401;
        throw err;
    }

    return {
        _id: student._id,
        displayName: student.displayName,
        email: student.email,
        token: generateToken(student._id),
        teacher: student.teacher,
    };
};

export const listMasterStudents = async () => {
    return MasterStudent.find({});
};
