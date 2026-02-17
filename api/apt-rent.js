export default async function handler(req, res) {
  const API_KEY = process.env.DATA_GO_KR_KEY;
  if (!API_KEY) return res.status(500).json({ error: "API key not configured" });

  const { LAWD_CD, DEAL_YMD, pageNo = 1, numOfRows = 1000 } = req.query;
  if (!LAWD_CD || !DEAL_YMD) return res.status(400).json({ error: "LAWD_CD and DEAL_YMD required" });

  const url = `https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent?serviceKey=${API_KEY}&LAWD_CD=${LAWD_CD}&DEAL_YMD=${DEAL_YMD}&pageNo=${pageNo}&numOfRows=${numOfRows}&_type=xml`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const text = await r.text();
    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(text);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
