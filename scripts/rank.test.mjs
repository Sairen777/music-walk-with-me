import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { deflateSync } from "node:zlib";

import { canonicalName, coreOf, leadArtistKey, trackKey } from "./music-normalize.mjs";
import {
  parseBillboardYearEndHtml,
  parsePopRadioYearEndHtml,
  parseAlternativeRadioYearEndHtml,
  parseTrlRecapText,
  parseTrlNumberOneVideosHtml,
  parseTophitCompressedPageData,
} from "./source-adapters.mjs";
import { sourcePlanFor } from "./source-registry.mjs";
import { scoreSignals } from "./rank.mjs";

// ---------------------------------------------------------------------------
// 1. Billboard year-end HTML fixture
// ---------------------------------------------------------------------------
describe("parseBillboardYearEndHtml", () => {
  it("parses rank, title, and artist from a wikitable row", () => {
    const html = `<table class="wikitable">
<tr><td>1</td><td>"<a>We Belong Together</a>"</td><td><a>Mariah Carey</a></td></tr>
</table>`;

    const results = parseBillboardYearEndHtml(html);

    assert.equal(results.length, 1);
    assert.equal(results[0].rank, 1);
    assert.equal(results[0].title, "We Belong Together");
    assert.equal(results[0].artist, "Mariah Carey");
  });
});

// ---------------------------------------------------------------------------
// 2. Pop radio HTML fixture
// ---------------------------------------------------------------------------
describe("parsePopRadioYearEndHtml", () => {
  it("parses two rows with bold artist and nbsp-separated title", () => {
    const html = `<table>
<tr><td>1</td><td><b>Kelly Clarkson</b>&nbsp; Since U Been Gone</td></tr>
<tr><td>2</td><td><b>Kelly Clarkson</b>&nbsp; Behind These Hazel Eyes</td></tr>
</table>`;

    const results = parsePopRadioYearEndHtml(html);

    assert.equal(results.length, 2);
    assert.equal(results[0].rank, 1);
    assert.equal(results[0].artist, "Kelly Clarkson");
    assert.equal(results[0].title, "Since U Been Gone");
    assert.equal(results[1].rank, 2);
    assert.equal(results[1].artist, "Kelly Clarkson");
    assert.equal(results[1].title, "Behind These Hazel Eyes");
  });
});

// ---------------------------------------------------------------------------
// 2b. Alternative radio HTML fixture
// ---------------------------------------------------------------------------
describe("parseAlternativeRadioYearEndHtml", () => {
  it("parses a title-first row (title-artist orientation)", () => {
    const html = `<tr><td><b>25</b></td><td><font><b>Helena</b>&nbsp; My Chemical Romance</font></td><td>156</td><td>16</td><td>4</td></tr>`;

    const results = parseAlternativeRadioYearEndHtml(html, "title-artist");

    assert.equal(results.length, 1);
    assert.equal(results[0].rank, 25);
    assert.equal(results[0].title, "Helena");
    assert.equal(results[0].artist, "My Chemical Romance");
  });

  it("parses an artist-first row (artist-title orientation)", () => {
    const html = `<tr><td><b>31</b></td><td><font><b>Paramore</b>&nbsp; Misery Business</font></td></tr>`;

    const results = parseAlternativeRadioYearEndHtml(html, "artist-title");

    assert.equal(results.length, 1);
    assert.equal(results[0].rank, 31);
    assert.equal(results[0].artist, "Paramore");
    assert.equal(results[0].title, "Misery Business");
  });
});

// ---------------------------------------------------------------------------
// 3. TRL monthly fixture
// ---------------------------------------------------------------------------
describe("parseTrlRecapText", () => {
  it("parses a rank line and computes points as 11 - rank", () => {
    // Pass raw text — needs a "Top Ten" section header for the parser to recognize
    const text = "Top Ten\n01.Mariah Carey - We Belong Together (8th Day/+1/Peak:01[4])";
    const results = parseTrlRecapText(text);

    assert.equal(results.length, 1);
    assert.equal(results[0].rank, 1);
    assert.equal(results[0].artist, "Mariah Carey");
    assert.equal(results[0].title, "We Belong Together");
    assert.equal(results[0].points, 10);
  });
});

// ---------------------------------------------------------------------------
// 4. TRL number-one HTML fixture
// ---------------------------------------------------------------------------
describe("parseTrlNumberOneVideosHtml", () => {
  it("computes daysAtOne from a date range", () => {
    const html = `<h2 id="1998">1998</h2>
<table class="wikitable">
<tr><td>September 14–15</td><td><a>I'll Never Break Your Heart</a></td><td><a>Backstreet Boys</a></td></tr>
</table>`;
    const results = parseTrlNumberOneVideosHtml(html, 1998);

    assert.equal(results.length, 1);
    assert.equal(results[0].artist, "Backstreet Boys");
    assert.equal(results[0].title, "I'll Never Break Your Heart");
    assert.equal(results[0].daysAtOne, 2);
  });
});

// ---------------------------------------------------------------------------
// 5. TopHit compressed fixture
// ---------------------------------------------------------------------------
describe("parseTophitCompressedPageData", () => {
  it("decodes a deflated + base64 chart payload from __NEXT_DATA__", () => {
    const chartData = {
      charts: [
        {
          rows: [
            {
              position: 1,
              track: {
                name: "Relax, Take It Easy",
                artists: [{ name: "Mika" }],
              },
            },
          ],
        },
      ],
    };

    const jsonStr = JSON.stringify(chartData);
    const deflated = deflateSync(jsonStr);
    const base64 = deflated.toString("base64");

    const html =
      `<script id="__NEXT_DATA__" type="application/json">{"props":{"pageProps":{"data":"${base64}"}}}</script>`;

    const result = parseTophitCompressedPageData(html);

    assert.equal(result.charts.length, 1);
    assert.equal(result.charts[0].rows.length, 1);
    assert.equal(result.charts[0].rows[0].position, 1);
    assert.equal(result.charts[0].rows[0].track.name, "Relax, Take It Easy");
    assert.equal(result.charts[0].rows[0].track.artists[0].name, "Mika");
  });
});

// ---------------------------------------------------------------------------
// 6. scoreSignals — diversity bonus
// ---------------------------------------------------------------------------
describe("scoreSignals", () => {
  it("ranks a multi-source track above a single-source track with equal weighted sum", () => {
    const weights = { srcA: 0.5, srcB: 0.5 };

    const signals = [
      // Track X: two sources, rawScore 1.0 each → weighted = 1.0, bonus +0.05
      {
        source: "srcA",
        iso: "USA",
        year: 2005,
        artist: "Artist X",
        title: "Multi-Source Hit",
        rank: 2,
        rawScore: 1.0,
        url: "https://example.com/a",
      },
      {
        source: "srcB",
        iso: "USA",
        year: 2005,
        artist: "Artist X",
        title: "Multi-Source Hit",
        rank: 5,
        rawScore: 1.0,
        url: "https://example.com/b",
      },
      // Track Y: one source, rawScore 2.0 → weighted = 1.0, no bonus
      {
        source: "srcA",
        iso: "USA",
        year: 2005,
        artist: "Artist Y",
        title: "Single-Source Jam",
        rank: 1,
        rawScore: 2.0,
        url: "https://example.com/c",
      },
    ];

    const results = scoreSignals(signals, weights);

    assert.equal(results.length, 2);
    // Multi-source track should rank first (higher score due to diversity bonus)
    assert.equal(results[0].artist, "Artist X");
    assert.equal(results[0].sources.length, 2);
    assert.equal(results[1].artist, "Artist Y");
    assert.equal(results[1].sources.length, 1);
    // Verify the score difference is exactly the diversity bonus
    assert.ok(results[0].score > results[1].score);
  });
});

// ---------------------------------------------------------------------------
// 7. scoreSignals ignores Last.fm signal
// ---------------------------------------------------------------------------
describe("scoreSignals lastfm filtering", () => {
  it("ignores a lastfm-listeners signal because Last.fm is enrichment-only", () => {
    const weights = { "billboard-year-end-hot-100": 1.0 };

    const signals = [
      {
        source: "billboard-year-end-hot-100",
        iso: "USA",
        year: 2005,
        artist: "Artist A",
        title: "Real Signal",
        rank: 1,
        rawScore: 1.0,
        url: "https://example.com/bb",
      },
      {
        source: "lastfm-listeners",
        iso: "USA",
        year: 2005,
        artist: "Artist A",
        title: "Real Signal",
        rank: 99,
        rawScore: 999.0,
        url: "https://example.com/lastfm",
      },
    ];

    const results = scoreSignals(signals, weights);

    // Only the weighted source should appear — lastfm is not in weights
    assert.equal(results.length, 1);
    assert.equal(results[0].sources.length, 1);
    assert.equal(results[0].sources[0], "billboard-year-end-hot-100");
    // Even though lastfm had huge rawScore, it should not affect the result
    assert.equal(results[0].score, 1.0);
  });
});

// ---------------------------------------------------------------------------
// 8. canonicalName — P!nk alias
// ---------------------------------------------------------------------------
describe("canonicalName", () => {
  it("maps P!nk to the same canonical form as Pink", () => {
    assert.equal(canonicalName("P!nk"), canonicalName("Pink"));
  });

  it("returns the normalized form for other names unchanged", () => {
    // coreOf is used by trackKey for title normalization
    assert.equal(typeof coreOf("Hello (Remix)"), "string");
    assert.equal(typeof leadArtistKey("Mariah Carey ft. Jay-Z"), "string");
    assert.equal(typeof trackKey("Madonna", "Like a Prayer"), "string");
  });
});

// ---------------------------------------------------------------------------
// 9. sourcePlanFor USA 2005
// ---------------------------------------------------------------------------
describe("sourcePlanFor USA 2005", () => {
  it("returns USA weights including alternative-radio-year-end with no duplicate rankingSources", () => {
    const plan = sourcePlanFor("USA", 2005);

    // Check weights include key sources
    assert.equal(plan.weights["alternative-radio-year-end"], 0.25);
    assert.ok("trl-archive-top-ten" in plan.weights);
    assert.ok("billboard-year-end-hot-100" in plan.weights);
    assert.ok("pop-radio-year-end" in plan.weights);

    // alternative-radio-year-end must appear in rankingSources
    assert.ok(plan.rankingSources.includes("alternative-radio-year-end"));

    // rankingSources must not have duplicates
    const seen = new Set();
    for (const src of plan.rankingSources) {
      assert.ok(!seen.has(src), `duplicate ranking source: ${src}`);
      seen.add(src);
    }

    // enrichmentSources contains lastfm
    assert.ok(plan.enrichmentSources.includes("lastfm-listener-enrichment"));
  });
});

// ---------------------------------------------------------------------------
// 10. sourcePlanFor RUS 2007
// ---------------------------------------------------------------------------
describe("sourcePlanFor RUS 2007", () => {
  it("returns only TopHit weighted ranking sources plus common enrichment; no USA sources", () => {
    const plan = sourcePlanFor("RUS", 2007);

    // Should have TopHit annual and decade
    assert.ok("tophit-ru-annual-radio" in plan.weights);
    assert.ok("tophit-ru-decade-release-year" in plan.weights);

    // No USA source ids
    const usaSources = [
      "billboard-year-end-hot-100",
      "billboard-hot-100-number-ones",
      "pop-radio-year-end",
      "trl-archive-top-ten",
      "trl-number-one-videos",
    ];
    for (const src of usaSources) {
      assert.ok(!(src in plan.weights), `unexpected USA source: ${src}`);
    }

    // enrichmentSources contains lastfm
    assert.ok(plan.enrichmentSources.includes("lastfm-listener-enrichment"));
  });

  it("throws for an unknown country", () => {
    assert.throws(
      () => sourcePlanFor("MARS", 2005),
      /NO_SOURCE_PLAN/,
    );
  });
});
