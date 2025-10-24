import Content from "../models/contentModel.js"

export const createArticle = async ({ teacherId, title, image, html }) => {
    const article = new Content({ teacherId, title, image, html });
    await article.save();
    return article;
};

export const getOne = async (articleId) => {
    console.log("here", articleId)
    return Content.findById(articleId);
};

export const listArticles = async (teacherId) => {
    return Content.find({ teacherId });
};

export const deleteArticle = async ({ teacherId, articleId }) => {
    const doc = await Content.findOneAndDelete({ _id: articleId, teacherId });
    return Boolean(doc);
};

export const updateArticle = async ({ teacherId, articleId, payload }) => {
    const updated = await Article.findOneAndUpdate(
        { _id: articleId, teacherId },
        { $set: payload },
        { new: true }
    );
    return updated;
};