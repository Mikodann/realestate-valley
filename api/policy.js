const https = require("https");

function naverSearch(query, CID, CSC) {
  return new Promise((resolve) => {
    const params = new URLSearchParams({ query, display: "10", sort: "date" });
    https.get("https://openapi.naver.com/v1/search/news.json?" + params, {
      headers: { "X-Naver-Client-Id": CID, "X-Naver-Client-Secret": CSC }
    }, r => {
      let d = ""; r.on("data", c => d += c);
      r.on("end", () => { try { resolve(JSON.parse(d).items || []); } catch(_) { resolve([]); } });
    }).on("error", () => resolve([]));
  });
}

const KW = ["주택","부동산","아파트","전세","임대","분양","재건축","재개발",
  "토지거래","주택공급","매매","청약","대출","토허","투기","실거래",
  "공시지가","종부세","취득세","양도세","임대차","신도시","GTX",
  "공공주택","택지","주거","정비사업","공급방안","규제","용적률"];

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const CID = process.env.NAVER_CLIENT_ID;
  const CSC = process.env.NAVER_CLIENT_SECRET;
  if (!CID || !CSC) return res.status(500).json({ error: "API keys missing" });

  const queries = [
    "국토교통부 부동산 정책",
    "국토부 주택 공급 대책",
    "국토교통부 보도자료 부동산",
    "국토부 전세 임대 정책",
    "국토교통부 재건축 재개발",
  ];

  const seen = new Set();
  const allItems = [];

  for (const q of queries) {
    const items = await naverSearch(q, CID, CSC);
    items.forEach(item => {
      const title = item.title.replace(/<[^>]*>/g, "");
      const desc = item.description.replace(/<[^>]*>/g, "");
      const text = title + " " + desc;

      // 필터: 국토부 언급 + 부동산 키워드 1개 이상
      const hasMotl = text.includes("국토교통") || text.includes("국토부");
      const kwHit = KW.filter(k => text.includes(k)).length;
      if (!hasMotl || kwHit < 1) return;

      const key = title.substring(0, 25);
      if (seen.has(key)) return;
      seen.add(key);

      allItems.push({
        title,
        description: desc.substring(0, 200),
        link: item.originallink || item.link,
        pubDate: item.pubDate,
      });
    });
  }

  allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  res.status(200).json({ count: allItems.length, data: allItems.slice(0, 15) });
};
