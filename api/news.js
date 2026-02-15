const https = require("https");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const { query = "서울 아파트 매매", count = "10" } = req.query;
  const CID = process.env.NAVER_CLIENT_ID;
  const CSC = process.env.NAVER_CLIENT_SECRET;

  if (!CID || !CSC) {
    return res.status(500).json({ error: "Naver API keys not configured" });
  }

  const params = new URLSearchParams({
    query,
    display: count,
    sort: "date",
  });

  const url = `https://openapi.naver.com/v1/search/news.json?${params.toString()}`;

  return new Promise((resolve) => {
    const options = {
      headers: {
        "X-Naver-Client-Id": CID,
        "X-Naver-Client-Secret": CSC,
      },
    };
    https.get(url, options, (apiRes) => {
      let data = "";
      apiRes.on("data", (chunk) => (data += chunk));
      apiRes.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.errorCode) {
            res.status(400).json({ error: json.errorMessage });
          } else {
            const items = (json.items || []).map((item) => ({
              title: item.title.replace(/<[^>]*>/g, ""),
              description: item.description.replace(/<[^>]*>/g, ""),
              link: item.originallink || item.link,
              pubDate: item.pubDate,
            }));
            res.status(200).json({ count: items.length, data: items });
          }
        } catch (e) {
          res.status(500).json({ error: "Parse error", raw: data.substring(0, 300) });
        }
        resolve();
      });
    }).on("error", (e) => {
      res.status(500).json({ error: e.message });
      resolve();
    });
  });
};
