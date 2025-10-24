import Publication from "../models/publication.js";
import { fetchScholarPublicationsFree } from "./scholarFreeService.js";

/* Tür sınıflandırma (heuristic) */
const classifyType = ({ title = "", venue = "" }) => {
    const hay = `${String(title).toLowerCase()} ${String(venue).toLowerCase()}`;

    if (/(konferans|conference|kongre|symposium|workshop|proceedings|proc\.)/.test(hay)) return "conference";
    if (/(book chapter|chapter|bölüm|kitap bölümü)/.test(hay)) return "book_chapter";
    if (/(book|kitap|springer|elsevier|wiley|crc press|cambridge|oxford)/.test(hay)) return "book";
    if (/(journal|revista|dergi)/.test(hay)) return "article";

    return "article";
};

const parseMaybeArray = (v) => {
    if (Array.isArray(v)) return v;
    if (typeof v === "string") {
        try { return JSON.parse(v); } catch { return v.split(",").map(s => s.trim()).filter(Boolean); }
    }
    return [];
};

export const normalizeCreatePayload = async ({ body, file, teacherId }) => {
    let { title, authors, year, venue, doi, url, type, tags } = body;

    const payload = {
        teacher: teacherId,
        title,
        authors: parseMaybeArray(authors),
        year,
        venue,
        doi,
        url,
        type: type || classifyType({ title, venue }),
        tags: parseMaybeArray(tags),
        source: "manual",
    };

    if (file) payload.pdfUrl = `/uploads/${file.filename}`;
    return payload;
};

export const createPublication = async (payload) => {
    const pub = new Publication(payload);
    return pub.save();
};

export const listPublications = async ({ teacherId, type, search, visible }) => {
    const q = { teacher: teacherId };

    if (type) q.type = type;
    if (visible === "true") q.isVisible = true;
    if (visible === "false") q.isVisible = false;

    if (search) {
        const s = new RegExp(search, "i");
        q.$or = [{ title: s }, { venue: s }, { doi: s }, { authors: s }];
    }

    return Publication.find(q).sort({ year: -1, createdAt: -1 });
};

export const findPublicationById = async (id) => Publication.findById(id);

export const updatePublication = async (doc, updates) => {
    Object.assign(doc, updates);
    return doc.save();
};

export const deletePublication = async (doc) => doc.deleteOne();

export const attachPdf = async (doc, file) => {
    doc.pdfUrl = `/uploads/${file.filename}`;
    return doc.save();
};

export const groupedVisibleByType = async (teacherId) => {
    const all = await Publication.find({ teacher: teacherId, isVisible: true }).sort({ year: -1 });
    return all.reduce((acc, p) => {
        if (!acc[p.type]) acc[p.type] = [];
        acc[p.type].push(p);
        return acc;
    }, {});
};

export const getScholarSuggestions = async (teacher) => {
    const { scholarUserId, _id: teacherId } = teacher;

    let scholarPubs = [];
    if (process.env.SERPAPI_KEY) {
        const url = `https://serpapi.com/search.json?engine=google_scholar_author&author_id=${encodeURIComponent(
            scholarUserId
        )}&api_key=${process.env.SERPAPI_KEY}`;

        const r = await fetch(url);
        const j = await r.json();
        scholarPubs = (j?.articles || []).map((a) => {
            const title = a.title;
            const venue = a.publication || a.journal;
            const predictedType = classifyType({ title, venue });
            return {
                title,
                year: Number(a.year) || undefined,
                venue,
                url: a.link,
                externalId: a.result_id,
                source: "scholar",
                authors: a?.authors?.map((x) => x.name) || [],
                type: predictedType,
                predictedType,
            };
        });
    } else {
        const raw = await fetchScholarPublicationsFree(scholarUserId, {
            pages: 5,
            pagesize: 100,
            hl: "tr",
            sleepMs: 1200,
        });
        scholarPubs = raw.map((p) => {
            const predictedType = classifyType({ title: p.title, venue: p.venue });
            return { ...p, type: predictedType, predictedType };
        });
    }

    const mine = await Publication.find({ teacher: teacherId });
    const hasSame = (t, y) =>
        mine.some(
            (m) => (m.title || "").toLowerCase() === (t || "").toLowerCase() && (!y || Number(m.year) === Number(y))
        );

    return scholarPubs.filter((p) => !hasSame(p.title, p.year));
};

export const bulkImportFromScholar = async (teacherId, items) => {
    return Publication.insertMany(
        items.map((x) => ({
            ...x,
            teacher: teacherId,
            source: "scholar",
            isVisible: true,
        }))
    );
};
