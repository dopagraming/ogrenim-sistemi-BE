import * as svc from "../services/makaleler.service.js";

/** GET /api/makaleler */
export const getAllForTeacher = async (req, res) => {
    if (!req.teacher) {
        return res.status(401).json({ message: "Yetkisiz erişim." });
    }
    const data = await svc.fetchTeacherArticles(req.teacher._id);
    return res.status(200).json({ data });
};

/** GET /api/makaleler/submissions */
export const getSubmissions = async (req, res) => {
    if (!req.teacher?._id) {
        return res.status(401).json({ message: "Yetkisiz erişim." });
    }
    console.log(req.query)
    const {
        q = "",
        studentName = "",
        status = "all",
        author = "",
        journal = "",
        year = "",
        page = 1,
        pageSize = 20,
    } = req.query;

    const out = await svc.aggregateSubmissions({
        teacherId: req.teacher._id,
        q,
        studentName,
        status,
        author,
        journal,
        year,
        page: Number(page) || 1,
        pageSize: Number(pageSize) || 20,
    });

    return res.status(200).json(out); // { data, total, page, pageSize }
};

/** POST /api/makaleler/teacher */
export const createByTeacher = async (req, res) => {
    if (!req.teacher?._id) {
        return res.status(401).json({ message: "Yetkisiz erişim." });
    }
    const payload = { ...req.body, teacher: req.teacher._id };
    const doc = await svc.createMakale(payload);
    return res.status(201).json(doc);
};

/** PUT /api/makaleler/:articleId/decision */
export const setSubmissionDecision = async (req, res) => {
    if (!req.teacher?._id) {
        return res.status(401).json({ message: "Yetkisiz erişim." });
    }

    const { articleId } = req.params;
    const { studentId, status, teacherNote } = req.body;

    await svc.setSubmissionDecision({
        articleId,
        teacherId: req.teacher._id,
        studentId,
        status,
        teacherNote,
    });

    return res.status(200).json({ message: "Durum güncellendi." });
};

/** PUT /api/makaleler/:id */
export const updateMakale = async (req, res) => {
    const updated = await svc.updateMakale(req.params.id, req.body);
    if (!updated) {
        return res.status(404).json({ message: "Makale bulunamadı." });
    }
    return res.status(200).json(updated);
};

/** DELETE /api/makaleler/:id */
export const deleteMakale = async (req, res) => {
    const ok = await svc.deleteMakale(req.params.id);
    if (!ok) {
        return res.status(404).json({ message: "Makale bulunamadı." });
    }
    return res.status(200).json({ message: "Makale başarıyla silindi." });
};

/** GET /api/makaleler/:studentId/makaleler */
export const getForStudent = async (req, res) => {
    const { studentId } = req.params;
    if (!studentId) {
        return res.status(400).json({ message: "Öğrenci ID gereklidir." });
    }

    const data = await svc.fetchStudentArticles(studentId);
    if (!data.length) {
        return res
            .status(200)
            .json({ data: [], message: "Bu öğrenci için makale bulunamadı." });
    }
    return res.status(200).json({ data });
};

/** PUT /api/makaleler/:id/student-submit */
export const studentSubmit = async (req, res) => {
    const { id } = req.params;

    await svc.saveStudentSubmission({
        articleId: id,
        studentId: req.student._id,
        body: req.body,
        submitted: true,
    });

    return res.status(200).json({ message: "Gönderim kaydedildi." });
};

/** PUT /api/makaleler/:id/student-save */
export const studentSaveDraft = async (req, res) => {
    const { id } = req.params;

    await svc.saveStudentSubmission({
        articleId: id,
        studentId: req.student._id,
        body: req.body,
        submitted: false,
    });

    return res.status(200).json({ message: "Taslak olarak kaydedildi." });
};

/** POST /api/makaleler/student-direct-add */
export const studentDirectAdd = async (req, res) => {
    const doc = await svc.studentDirectAdd({
        student: req.student,
        body: req.body,
    });
    return res.status(201).json({ data: doc });
};

/** POST /api/makaleler/student-request-add */
export const studentRequestAdd = async (req, res) => {
    const doc = await svc.studentRequestAdd({
        student: req.student,
        body: req.body,
    });
    return res.status(201).json({ data: doc });
};

/** PUT /api/makaleler/:articleId/proposal-decision */
export const setProposalDecision = async (req, res) => {
    if (!req.teacher?._id) {
        return res.status(401).json({ message: "Yetkisiz erişim." });
    }

    const { articleId } = req.params;
    const { decision, studentId } = req.body;

    const data = await svc.setProposalDecision({
        articleId,
        teacherId: req.teacher._id,
        decision,
        studentId,
    });

    return res.json({ message: "Güncellendi.", data });
};

/** GET /api/makaleler/:id */
export const getById = async (req, res) => {
    const doc = await svc.getById(req.params.id);
    if (!doc) {
        return res.status(404).json({ message: "Makale bulunamadı." });
    }
    return res.status(200).json(doc);
};
