const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const {
    lat, lng, // center coords
    tradTp = 'A1:B1:B2', // A1=매매, B1=전세, B2=월세
    rletTp = 'APT',       // APT, OPST, ABYG, etc
    z = 15,
    cortarNo = '',
  } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat, lng 필수' });
  }

  const latF = parseFloat(lat);
  const lngF = parseFloat(lng);

  // Calculate bounding box (~500m radius at z=15)
  const offset = 0.005;
  const btm = (latF - offset).toFixed(7);
  const top_ = (latF + offset).toFixed(7);
  const lft = (lngF - offset).toFixed(7);
  const rgt = (lngF + offset).toFixed(7);

  const params = new URLSearchParams({
    rletTpCd: rletTp,
    tradTpCd: tradTp,
    z: String(z),
    lat: String(latF),
    lon: String(lngF),
    btm,
    lft,
    top: top_,
    rgt,
    spcMin: '0',
    spcMax: '900000000',
    showR0: '',
    cortarNo,
  });

  const url = `https://m.land.naver.com/cluster/ajax/articleList?${params.toString()}`;

  try {
    const data = await new Promise((resolve, reject) => {
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'Referer': 'https://m.land.naver.com/',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        }
      };

      https.get(url, options, (response) => {
        let body = '';
        response.on('data', chunk => body += chunk);
        response.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error('JSON parse failed'));
          }
        });
      }).on('error', reject);
    });

    // Parse and simplify the response
    const articles = (data.body || []).map(item => ({
      id: item.atclNo,
      name: item.atclNm || '',
      complex: item.cpNm || '',
      type: item.rletTpNm || '',          // 아파트, 오피스텔 등
      trade: item.tradTpNm || '',          // 매매, 전세, 월세
      price: item.hanPrc || '',            // 한글 가격
      deposit: item.rentPrc || '',         // 보증금 (월세)
      area1: item.spc1 || '',             // 공급면적
      area2: item.spc2 || '',             // 전용면적
      floor: item.flrInfo || '',          // 층
      direction: item.direction || '',     // 방향
      desc: item.atclFetrDesc || '',       // 특징
      tags: item.tagList || [],
      lat: item.lat,
      lng: item.lng,
      confirm: item.cfmYmd || '',          // 확인일자
      link: item.atclNo ? `https://new.land.naver.com/houses/${item.atclNo}` : '',
    }));

    return res.status(200).json({
      success: true,
      total: data.totAtclCnt || articles.length,
      articles,
    });
  } catch (e) {
    return res.status(500).json({
      error: e.message,
      hint: '네이버 부동산 API 호출 실패. 잠시 후 재시도하세요.',
    });
  }
};
