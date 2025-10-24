import asyncHandler from "express-async-handler";
import * as svc from "../services/users.service.js";

export const listUsers = asyncHandler(async (req, res) => {
    const { q = "", role = "", page = 1, pageSize = 20 } = req.query;
    const out = await svc.listUsers({
        q: String(q || ""),
        role: String(role || ""),
        page: Number(page) || 1,
        pageSize: Number(pageSize) || 20,
    });
    return res.status(200).json(out);
});

export const createUser = asyncHandler(async (req, res) => {
    // expected body:
    // {
    //   role: "teacher" | "student",
    //   displayName, email, password?,
    //   department?, office?, phone?, photoURL?, // teachers
    //   teacher? // for student: advisor ObjectId (optional)
    // }
    const out = await svc.createUser(req.body);
    return res.status(201).json(out);
});

export const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const out = await svc.updateUser(id, req.body);
    return res.status(200).json(out);
});

export const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const role = req.teacher.role;
    const ok = await svc.deleteUser(id, String(role || ""));
    if (!ok) return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    return res.status(204).end();
});
