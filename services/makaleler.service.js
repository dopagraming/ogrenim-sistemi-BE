// services/makaleler.service.js
import Makale from "../models/makaleler.js";
import mongoose from "mongoose";
import MasterStudent from "../models/masterStudentModel.js";

/* --------------------------- Queries / Fetchers --------------------------- */

export const fetchTeacherArticles = async (teacherId) => {
    return Makale.find({ teacher: teacherId })
        .populate("teacher", "name email")
        .populate("proposedBy", "name email")
        .populate("students", "name email")
        .sort({ createdAt: -1 });
};

const MASTER_STUDENT_COLLECTION = "masterstudents"

/**
 * List teacher submissions with search/filters/pagination
 */
export const aggregateSubmissions = async ({
    teacherId,
    q = "",
    studentName = "",
    status = "all",
    author = "",
    journal = "",
    year = "",
    page = 1,
    pageSize = 20,
}) => {
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const s = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);

    const hasQ = !!q?.trim();
    const hasStudentName = !!studentName?.trim();
    const hasStatus = !!status && status !== "all";
    const hasAuthor = !!author?.trim();
    const hasJournal = !!journal?.trim();
    const yearNum = Number(year);
    const hasYear = Number.isInteger(yearNum) && year !== "";

    const teacherCond = { teacher: new mongoose.Types.ObjectId(teacherId) };
    const subsCond = { studentSubmissions: { $exists: true, $ne: [] } };

    // شروط تتطبّق على وثيقة المقال نفسها (قبل الـ unwind)
    const articleFieldConds = [];
    if (hasAuthor) articleFieldConds.push({ author: { $regex: author.trim(), $options: "i" } });
    if (hasJournal) articleFieldConds.push({ journal: { $regex: journal.trim(), $options: "i" } });
    if (hasYear) articleFieldConds.push({ year: yearNum });

    // 1) $text أولاً لو q موجودة
    const firstMatch = hasQ
        ? { $match: { $and: [{ $text: { $search: q.trim() } }, teacherCond, subsCond, ...articleFieldConds] } }
        : { $match: { $and: [teacherCond, subsCond, ...articleFieldConds] } };

    const pipeline = [
        firstMatch,

        // score للنص للفرز لاحقًا
        ...(hasQ ? [{ $addFields: { textScore: { $meta: "textScore" } } }] : []),

        // سطر لكل submission
        { $unwind: { path: "$studentSubmissions", preserveNullAndEmptyArrays: false } },

        // lookup الطالب (يدعم ObjectId أو string 24-hex)
        { $set: { rawStudentId: "$studentSubmissions.student" } },
        {
            $lookup: {
                from: MASTER_STUDENT_COLLECTION,
                let: { sid: "$rawStudentId" },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $or: [
                                    { $and: [{ $eq: [{ $type: "$$sid" }, "objectId"] }, { $eq: ["$_id", "$$sid"] }] },
                                    {
                                        $and: [
                                            { $eq: [{ $type: "$$sid" }, "string"] },
                                            { $regexMatch: { input: "$$sid", regex: /^[0-9a-fA-F]{24}$/ } },
                                            { $eq: ["$_id", { $toObjectId: "$$sid" }] },
                                        ]
                                    },
                                ],
                            },
                        },
                    },
                    { $project: { _id: 1, name: 1, email: 1, studentNumber: 1 } },
                ],
                as: "studentDoc",
            },
        },
        {
            $set: {
                "studentSubmissions.student": {
                    $let: {
                        vars: { s: { $first: "$studentDoc" } },
                        in: {
                            _id: { $ifNull: ["$$s._id", null] },
                            name: { $ifNull: ["$$s.name", null] },
                            email: { $ifNull: ["$$s.email", null] },
                            studentNumber: { $ifNull: ["$$s.studentNumber", null] },
                        },
                    },
                },
            },
        },

        // 2) فلاتر تعتمد على بيانات الـ lookup
        ...(hasStatus ? [{ $match: { "studentSubmissions.status": status } }] : []),
        ...(hasStudentName
            ? [{ $match: { "studentSubmissions.student.name": { $regex: studentName.trim(), $options: "i" } } }]
            : []),

        // 3) إعادة تجميع المقال
        {
            $group: {
                _id: "$_id", // انتبه: بدون نقطة
                doc: { $first: "$$ROOT" },
                studentSubmissions: { $push: "$studentSubmissions" },
                textScore: { $max: "$textScore" },
            },
        },
        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: [
                        "$doc",
                        { studentSubmissions: "$studentSubmissions" },
                        ...(hasQ ? [{ textScore: "$textScore" }] : []),
                    ],
                },
            },
        },

        // تنظيف
        { $project: { studentDoc: 0, rawStudentId: 0 } },

        // فرز + ترقيم
        { $sort: hasQ ? { textScore: -1, createdAt: -1 } : { createdAt: -1 } },
        {
            $facet: {
                meta: [{ $count: "total" }],
                items: [{ $skip: (p - 1) * s }, { $limit: s }],
            },
        },
    ];

    const [out] = await Makale.aggregate(pipeline);
    const total = out?.meta?.[0]?.total || 0;
    const items = out?.items || [];
    return { data: items, total, page: p, pageSize: s };
};

export const createMakale = async (payload) => {
    const doc = new Makale(payload);
    return doc.save();
};

export const setSubmissionDecision = async ({
    articleId,
    teacherId,
    studentId,
    status,
    teacherNote,
}) => {
    const article = await Makale.findById(articleId);
    if (!article) throw new Error("Makale bulunamadı.");

    if (article.teacher.toString() !== teacherId.toString()) {
        const err = new Error("Bu makaleye erişim izniniz yok.");
        err.statusCode = 403;
        throw err;
    }

    const submission = article.studentSubmissions.find(
        (sub) => String(sub.student) === String(studentId)
    );
    if (!submission) throw new Error("Gönderim bulunamadı.");

    submission.teacherNote = teacherNote ?? submission.teacherNote;
    submission.status = status ?? submission.status;
    // If rejected -> mark as not submitted; otherwise keep/mark submitted.
    submission.submitted = status === "rejected" ? false : true;

    await article.save();
};

export const updateMakale = async (id, updates) => {
    const doc = await Makale.findById(id);
    if (!doc) return null;
    Object.assign(doc, updates);
    return doc.save();
};

export const deleteMakale = async (id) => {
    const doc = await Makale.findById(id);
    if (!doc) return false;
    await Makale.deleteOne({ _id: id });
    return true;
};

export const fetchStudentArticles = async (studentId) => {
    return Makale.find({ students: studentId })
        .populate("teacher", "name email")
        .populate("students", "name email")
        .sort({ createdAt: -1 });
};

export const saveStudentSubmission = async ({
    articleId,
    studentId,
    body,
    submitted,
}) => {
    const {
        preprocessing,
        methods,
        classification,
        results,
        database,
        analysis,
        labels,
    } = body;

    const makale = await Makale.findById(articleId);
    if (!makale) throw new Error("Makale bulunamadı.");

    // Ensure the student is assigned to this article
    if (!makale.students.map(String).includes(String(studentId))) {
        const err = new Error("Bu makaleye atanmış değilsiniz.");
        err.statusCode = 403;
        throw err;
    }

    const existing = makale.studentSubmissions.find(
        (s) => String(s.student) === String(studentId)
    );

    const baseFields = {
        preprocessing,
        methods,
        classification,
        results,
        database,
        analysis,
        labels,
    };

    if (existing) {
        Object.assign(existing, {
            ...baseFields,
            status: submitted ? "waiting" : existing.status ?? "waiting",
            isAccepted: submitted ? false : existing.isAccepted ?? false,
            submitted: Boolean(submitted),
            // If submitting, preserve lastSavedAt if it exists, else set now once.
            lastSavedAt: submitted
                ? existing.lastSavedAt ?? new Date()
                : new Date(),
        });
    } else {
        makale.studentSubmissions.push({
            student: studentId,
            ...baseFields,
            status: "waiting",
            submitted: Boolean(submitted),
            lastSavedAt: submitted ? undefined : new Date(),
        });
    }

    await makale.save();
};

export const studentDirectAdd = async ({ student, body }) => {
    const { title, doi, year, journal, abstract } = body;
    return Makale.create({
        name: title,
        abstract,
        year,
        doi,
        journal,
        teacher: student.teacher,
        students: [student._id],
        origin: "student",
        proposedBy: student._id,
        manuscriptSubmission: true,
        reviewStatus: "approved",
    });
};

export const studentRequestAdd = async ({ student, body }) => {
    const { title, doi, year, journal, abstract, url } = body;
    return Makale.create({
        name: title,
        abstract,
        year,
        journal,
        doi,
        address: url,
        teacher: student.teacher,
        students: [],
        origin: "student",
        proposedBy: student._id,
        manuscriptSubmission: false,
        reviewStatus: "pending",
    });
};

export const setProposalDecision = async ({
    articleId,
    teacherId,
    decision,
    studentId,
}) => {
    const article = await Makale.findById(articleId);
    if (!article) throw new Error("Makale bulunamadı.");

    if (article.teacher && String(article.teacher) !== String(teacherId)) {
        const err = new Error("Bu makaleye erişim izniniz yok.");
        err.statusCode = 403;
        throw err;
    }

    if (decision === "approved") {
        article.manuscriptSubmission = true;
        article.reviewStatus = "approved";
        article.approvedBy = teacherId;
        article.approvedAt = new Date();

        if (
            studentId &&
            !article.students.some((id) => String(id) === String(studentId))
        ) {
            article.students.push(studentId);
        }
    } else {
        article.manuscriptSubmission = false;
        article.reviewStatus = "rejected";
        article.approvedBy = teacherId;
        article.approvedAt = new Date();
    }

    await article.save();
    return article;
};

export const getById = async (id) => {
    return Makale.findById(id).populate("teacher", "name email");
};
