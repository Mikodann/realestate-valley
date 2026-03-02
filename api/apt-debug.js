const https = require("https");
module.exports = async (req, res) => {
  const API_KEY = process.env.DATA_GO_KR_KEY;
  const url = `https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev?serviceKey=${API_KEY}&LAWD_CD=11680&DEAL_YMD=202602&pageNo=1&numOfRows=3`;
  return new Promise((resolve) => {
    https.get(url, (apiRes) => {
      let data = "";
      apiRes.on("data", (chunk) => (data += chunk));
      apiRes.on("end", () => {
        res.status(200).json({ statusCode: apiRes.statusCode, keyPrefix: (API_KEY||"").substring(0,10), raw: data.substring(0, 500) });
        resolve();
      });
    }).on("error", (e) => {
      res.status(500).json({ error: e.message });
      resolve();
    });
  });
};
