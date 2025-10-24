import * as svc from "../services/content.service.js";

// GET /api/teachers/articles/:id
export const getOne = async (req, res) => {
    try {
        console.log(req.params.id)
        const article = await svc.getOne(req.params.id);
        return res.status(200).json(article);
    } catch (err) {
        return res.status(500).json({ message: "Makaleler getirilirken bir hata oluştu." });
    }
};

// POST /api/teachers/articles
export const createArticle = async (req, res) => {
    try {
        const { title = "", image = "", html } = req.body;

        if (!html || !String(html).trim()) {
            return res.status(400).json({ message: "İçerik boş olamaz." });
        }

        if (title && String(title).length > 180) {
            return res
                .status(400)
                .json({ message: "Başlık 180 karakteri geçmemelidir." });
        }

        await svc.createArticle({
            teacherId: req.teacher._id,
            title: String(title).trim(),
            image: String(image).trim(),
            html,
        });

        return res
            .status(200)
            .json({ message: "Makale başarıyla kaydedildi." });
    } catch (err) {
        return res
            .status(500)
            .json({ message: "Makale kaydedilirken bir hata oluştu." });
    }
};

// GET /api/teachers/:teacherId/articles
export const listArticles = async (req, res) => {
    try {
        const articles = await svc.listArticles(req.params.teacherId);
        console.log(articles)
        return res.status(200).json(articles);
    } catch (err) {
        return res.status(500).json({ message: "Makaleler getirilirken bir hata oluştu." });
    }
};

// DELETE /api/teachers/:teacherId/articles/:articleId
export const deleteArticle = async (req, res) => {
    try {
        const ok = await svc.deleteArticle({
            teacherId: req.params.teacherId,
            articleId: req.params.articleId,
        });
        if (!ok) return res.status(404).json({ message: "Makale bulunamadı." });
        return res.status(200).json({ message: "Makale başarıyla silindi." });
    } catch (err) {
        return res.status(500).json({ message: "Makale silinirken bir hata oluştu." });
    }
};

// PUT /api/teachers/:teacherId/articles/:articleId
export const updateArticle = async (req, res) => {
    try {
        const { teacherId, articleId } = req.params;
        const payload = {};

        if (typeof req.body.title === "string") {
            if (req.body.title.length > 180) {
                return res
                    .status(400)
                    .json({ message: "Başlık 180 karakteri geçmemelidir." });
            }
            payload.title = req.body.title.trim();
        }
        if (typeof req.body.image === "string") {
            payload.image = req.body.image.trim();
        }
        if (typeof req.body.html === "string") {
            if (!req.body.html.trim()) {
                return res.status(400).json({ message: "İçerik boş olamaz." });
            }
            payload.html = req.body.html;
        }

        const updated = await svc.updateArticle({ teacherId, articleId, payload });
        if (!updated) {
            return res.status(404).json({ message: "Makale bulunamadı." });
        }
        return res.status(200).json(updated);
    } catch (err) {
        return res
            .status(500)
            .json({ message: "Güncelleme sırasında bir hata oluştu." });
    }
};
