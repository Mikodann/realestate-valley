const fs = require("fs");
const path = require("path");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=1800");

  try {
    const dataPath = path.join(process.cwd(), "public", "data", "youtube-insights.json");

    if (!fs.existsSync(dataPath)) {
      // 파일 없으면 기본 하드코딩 데이터 반환
      return res.status(200).json({
        updated_at: "수동 입력",
        channels: []
      });
    }

    const raw = fs.readFileSync(dataPath, "utf-8");
    const data = JSON.parse(raw);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
