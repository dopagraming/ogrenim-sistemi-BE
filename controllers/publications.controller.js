import * as svc from "../services/publications.service.js";

export const createPublication = async (req, res) => {
    if (!req.teacher) return res.status(401).json({ message: "Yetkisiz erişim." });

    const payload = await svc.normalizeCreatePayload({
        body: req.body,
        file: req.file,
        teacherId: req.teacher._id,
    });

    const saved = await svc.createPublication(payload);
    return res.status(201).json({ data: saved });
};

export const listPublications = async (req, res) => {
    if (!req.teacher) return res.status(401).json({ message: "Yetkisiz erişim." });

    const { type, search, visible } = req.query;
    const data = await svc.listPublications({
        teacherId: req.teacher._id,
        type,
        search,
        visible,
    });

    return res.json({ data });
};

export const updatePublication = async (req, res) => {
    const pub = await svc.findPublicationById(req.params.id);
    if (!pub) return res.status(404).json({ message: "Kayıt bulunamadı." });

    if (String(pub.teacher) !== String(req.teacher._id)) {
        return res.status(403).json({ message: "Bu kaynağa erişim izniniz yok." });
    }

    const saved = await svc.updatePublication(pub, req.body);
    return res.json({ data: saved });
};

export const deletePublication = async (req, res) => {
    const pub = await svc.findPublicationById(req.params.id);
    if (!pub) return res.status(404).json({ message: "Kayıt bulunamadı." });

    if (String(pub.teacher) !== String(req.teacher._id)) {
        return res.status(403).json({ message: "Bu kaynağa erişim izniniz yok." });
    }

    await svc.deletePublication(pub);
    return res.json({ message: "Silindi." });
};

export const uploadPdf = async (req, res) => {
    const pub = await svc.findPublicationById(req.params.id);
    if (!pub) return res.status(404).json({ message: "Kayıt bulunamadı." });

    if (String(pub.teacher) !== String(req.teacher._id)) {
        return res.status(403).json({ message: "Bu kaynağa erişim izniniz yok." });
    }

    if (!req.file) return res.status(400).json({ message: "PDF gerekli." });

    const updated = await svc.attachPdf(pub, req.file);
    return res.json({ data: updated, message: "PDF yüklendi." });
};

export const groupedPublicationsPublic = async (req, res) => {
    const { teacherId } = req.params;
    const grouped = await svc.groupedVisibleByType(teacherId);
    return res.json({ data: grouped });
};

export const scholarCheck = async (req, res) => {
    if (!req.teacher) return res.status(401).json({ message: "Yetkisiz erişim." });

    const { teacher } = req;
    if (!teacher.scholarUserId) {
        return res.status(400).json({ message: "Teacher.scholarUserId yok." });
    }

    const suggestions = await svc.getScholarSuggestions(teacher);
    return res.json({
        data: suggestions,
        count: suggestions.length,
        note: "Eksik yayın önerileri. Eklemeden önce türü kontrol edip güncelleyebilirsiniz.",
    });
};

export const scholarImport = async (req, res) => {
    if (!req.teacher) return res.status(401).json({ message: "Yetkisiz erişim." });

    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "items boş." });
    }

    const docs = await svc.bulkImportFromScholar(req.teacher._id, items);
    return res.json({ message: "İçe aktarıldı.", data: docs });
};
