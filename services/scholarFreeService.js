// services/scholarFreeService.js
import * as cheerio from "cheerio";

const UA =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

async function fetchPage(userId, cstart = 0, pagesize = 100, hl = "en") {
    const url = `https://scholar.google.com/citations?user=${encodeURIComponent(
        userId
    )}&hl=${hl}&cstart=${cstart}&pagesize=${pagesize}`;
    const res = await fetch(url, {
        headers: {
            "User-Agent": UA,
            "Accept-Language": "en-US,en;q=0.9,tr;q=0.8",
            "Cache-Control": "no-cache",
        },
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        const err = new Error(`Scholar fetch failed: ${res.status}`);
        err.status = res.status;
        err.body = text?.slice(0, 500);
        throw err;
    }
    return res.text();
}

function guessTypeFromVenue(venue = "") {
    const v = (venue || "").toLowerCase();
    if (/conference|proc\.|proceedings|symposium|workshop/.test(v)) return "conference";
    if (/journal|revista|dergi/.test(v)) return "article";
    if (/chapter|book chapter|bölüm/.test(v)) return "book_chapter";
    if (/springer|elsevier|wiley|book/.test(v)) return "book";
    return "other";
}

/** يحلّل صفحة واحدة ويرجع العناصر */
function parsePublications(html) {
    const $ = cheerio.load(html);
    const rows = $(".gsc_a_tr");
    const out = [];

    rows.each((_, el) => {
        const $row = $(el);
        const $title = $row.find(".gsc_a_at");
        const title = $title.text().trim();

        const metaLines = $row.find(".gsc_a_t .gs_gray");
        const authorsLine = metaLines.eq(0).text().trim();
        const venueLine = metaLines.eq(1).text().trim();

        const year = Number($row.find(".gsc_a_y span").text().trim()) || undefined;

        const rel = $title.attr("href");
        const link = rel ? `https://scholar.google.com${rel}` : undefined;

        if (!title) return;

        const predictedType = guessTypeFromVenue(venueLine);

        out.push({
            title,
            authors: authorsLine
                ? authorsLine.split(",").map((s) => s.trim()).filter(Boolean)
                : [],
            venue: venueLine || undefined,
            year,
            url: link,
            source: "scholar",
            type: predictedType,       // مبدئي
            predictedType,             // للعرض
        });
    });

    const hasNext = $(".gsc_pgn .gsc_pgn_pnx").length > 0;
    return { items: out, hasNext };
}

/** يجلب عدة صفحات (حد أقصى) */
export async function fetchScholarPublicationsFree(userId, opts = {}) {
    const {
        pages = 3,
        pagesize = 100,
        hl = "en",
        sleepMs = 1200,
    } = opts;

    let cstart = 0;
    const all = [];

    for (let i = 0; i < pages; i++) {
        const html = await fetchPage(userId, cstart, pagesize, hl);
        const { items, hasNext } = parsePublications(html);
        all.push(...items);
        if (!hasNext) break;
        cstart += pagesize;
        if (sleepMs) await new Promise((r) => setTimeout(r, sleepMs));
    }

    const seen = new Set();
    const uniq = [];
    for (const it of all) {
        const key = `${(it.title || "").toLowerCase().trim()}__${it.year || ""}__${(it.venue || "").toLowerCase().trim()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        uniq.push(it);
    }
    return uniq;
}
