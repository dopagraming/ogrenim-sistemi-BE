import * as svc from "../services/students.service.js";
import fetch from "node-fetch";
/** GET /api/students/check */
export const checkByNumber = async (req, res) => {
    const { number } = req.query;
    if (!number) {
        return res.status(400).json({ message: "Numara zorunludur." });
    }

    const student = await svc.findStudentByNumber(String(number).trim());
    if (student) return res.status(200).json({ data: student });

    // 204 ile body gönderilmez; bunun yerine 200 + data:false döndürüyoruz.
    return res.status(200).json({ data: false, message: "Öğrenci bulunamadı." });
};

/** POST /api/students/create-password */
export const createPassword = async (req, res) => {
    const { token, password, captchaToken } = req.body;

    if (!token || !password) {
        return res
            .status(400)
            .json({ success: false, message: "Token ve şifre zorunludur." });
    }

    if (!captchaToken) {
        return res
            .status(400)
            .json({ success: false, message: "CAPTCHA doğrulaması gereklidir." });
    }

    try {
        const params = new URLSearchParams();
        params.append("secret", process.env.RECAPTCHA_SECRET);
        params.append("response", captchaToken);

        if (req.ip) params.append("remoteip", req.ip);

        const gRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString(),
        });
        const gData = await gRes.json();

        if (!gData?.success) {
            return res
                .status(400)
                .json({ success: false, message: "CAPTCHA doğrulaması başarısız." });
        }

        await svc.createPasswordWithInvitation({ token, password });

        return res
            .status(200)
            .json({ success: true, message: "Şifre başarıyla oluşturuldu." });
    } catch (err) {
        const code = err.statusCode || 500;
        return res.status(code).json({ success: false, message: err.message });
    }
};

/** POST /api/students/login */
export const loginMasterStudent = async (req, res) => {
    const { email, password } = req.body;
    const payload = await svc.loginMasterStudent({ email, password });
    return res.status(200).json(payload);
};

/** GET /api/students/masterstudents */
export const listMasterStudents = async (_req, res) => {
    const students = await svc.listMasterStudents();
    if (!students?.length) {
        return res.status(200).json({ data: [], message: "Kayıt bulunamadı." });
    }
    return res.status(200).json({ data: students });
};
