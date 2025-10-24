import * as svc from "../services/teachers.service.js";

// GET /api/teachers/:id
export const getTeacher = async (req, res) => {
    const doc = await svc.findTeacherById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Öğretmen bulunamadı." });
    return res.status(200).json(doc);
};

// GET /api/teachers
export const list = async (req, res) => {
    try {
        const q = typeof req.query.q === 'string' ? req.query.q : '';
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 12, 1), 100);
        const includeCounts = String(req.query.includeCounts || 'false') === 'true';

        // NEW
        const faculty = typeof req.query.faculty === 'string' ? req.query.faculty : '';
        const department = typeof req.query.department === 'string' ? req.query.department : '';

        const out = await svc.listTeachers({ q, page, pageSize, includeCounts, faculty, department });

        return res.status(200).json({
            items: out.items || [],
            total: out.total ?? 0,
            page: out.page ?? page,
            pageSize: out.pageSize ?? pageSize,
        });
    } catch (err) {
        console.error('[teachers.list] error:', err);
        return res.status(500).json({ message: 'Öğretmen listesi getirilemedi.' });
    }
};

// PUT /api/teachers/profile
export const updateProfile = async (req, res) => {
    try {
        return await svcUpdateProfile(req, res);
    } catch (e) {
        return res.status(500).json({ message: "Profil güncellenirken hata oluştu." });
    }
};

// DELETE /api/teachers/:id
export const deleteTeacher = async (req, res) => {
    const ok = await svc.deleteTeacherOwned({ teacherId: req.params.id, requesterId: req.teacher?._id });
    if (!ok.allowed) return res.status(401).json({ message: "Bu öğretmeni silme yetkiniz yok." });
    if (!ok.exists) return res.status(404).json({ message: "Öğretmen bulunamadı." });
    return res.status(200).json({ message: "Öğretmen silindi." });
};

// POST /api/teachers/upload
export const uploadFile = async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "Dosya yüklenmedi." });
    try {
        const result = await svc.importStudentsFromXlsx(req.file.path);
        return res.status(200).json(result);
    } catch (e) {
        console.error(e);
        return res.status(500).json({ message: "Yükleme başarısız." });
    }
};

// GET /api/teachers/:id/booking-options
export const getBookingOptions = async (req, res) => {
    try {
        console.log("here")
        const { id } = req.params;
        console.log(id)
        const { level } = req.query; // "lisans" | "yukseklisans" | undefined
        console.log(level)
        const data = await svc.getBookingOptions(id, level);
        console.log(data)
        return res.status(200).json({ data });
    } catch (err) {
        return res.status(404).json({ message: "Öğretmen bulunamadı." });
    }
};


// POST /api/teachers/add-student
export const addStudent = async (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json({ message: "Ad ve e-posta zorunludur." });
    }
    try {
        await svc.addStudentAndInvite({ teacherId: req.teacher._id, name, email });
        return res.status(201).json({
            success: true,
            message: "Öğrenci eklendi. Şifre oluşturma e-postası gönderildi.",
        });
    } catch (error) {
        const code = error.statusCode || 500;
        return res.status(code).json({ message: error.message || "İşlem sırasında bir hata oluştu." });
    }
};

// PUT /api/teachers/:id/booking-options
export const updateBookingOptions = async (req, res) => {
    try {
        const updated = await svc.updateBookingOptions(req.params.id, req.body);
        return res.status(200).json(updated);
    } catch {
        return res.status(404).json({ message: "Öğretmen bulunamadı." });
    }
};
