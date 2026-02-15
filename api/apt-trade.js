const https = require("https");

function parseXML(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const get = (tag) => {
      const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
      return m ? m[1].trim() : "";
    };
    items.push({
      aptName: get("aptNm"),
      price: get("dealAmount").replace(/,/g, "").trim(),
      area: get("excluUseAr"),
      floor: get("floor"),
      year: get("dealYear"),
      month: get("dealMonth"),
      day: get("dealDay"),
      dong: get("umdNm"),
      buildYear: get("buildYear"),
      jibun: get("jibun"),
      dealType: get("dealingGbn"),
      aptDong: get("aptDong"),
    });
  }
  return items;
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const { region = "11680", year_month = "202501" } = req.query;
  const API_KEY = process.env.DATA_GO_KR_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "API key not configured" });
  }

  const baseUrl = "https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade";
  const params = new URLSearchParams({
    serviceKey: API_KEY,
    LAWD_CD: region,
    DEAL_YMD: year_month,
    pageNo: "1",
    numOfRows: "1000",
  });

  const url = `${baseUrl}?${params.toString()}`;

  return new Promise((resolve) => {
    https.get(url, (apiRes) => {
      let data = "";
      apiRes.on("data", (chunk) => (data += chunk));
      apiRes.on("end", () => {
        try {
          const items = parseXML(data);
          res.status(200).json({ count: items.length, data: items });
        } catch (e) {
          res.status(500).json({ error: "Parse error", message: e.message });
        }
        resolve();
      });
    }).on("error", (e) => {
      res.status(500).json({ error: e.message });
      resolve();
    });
  });
};
