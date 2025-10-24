export const requireAdmin = (req, res, next) => {
    const role = req.teacher?.role;
    if (role !== "admin") {
        return res.status(403).json({ message: "Bu işlem için yetkiniz yok." });
    }
    next();
};
