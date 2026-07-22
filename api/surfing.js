const API_URL = "https://apis.data.go.kr/1192136/fcstSurfingv2/GetFcstSurfingApiServicev2";

const firstValue = (item, keys) => {
  for (const key of keys) {
    if (item?.[key] !== undefined && item[key] !== null && item[key] !== "") return item[key];
  }
  return null;
};

const numberValue = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(String(value).replace(/[^0-9.+-]/g, ""));
  return Number.isFinite(number) ? number : null;
};

const normalize = (value) => String(value || "").replace(/\s/g, "").toLowerCase();

const getItems = (payload) => {
  const items = payload?.response?.body?.items?.item || payload?.body?.items?.item || payload?.items?.item || [];
  return Array.isArray(items) ? items : [items];
};

const findSpot = (items, spotName, lat, lon) => {
  const target = normalize(spotName);
  const named = items.filter((item) => {
    const name = normalize(firstValue(item, ["surfPlcNm", "sptNm", "spotName", "placeName", "surfingPlaceName", "srfPntNm"]));
    return target && name && (name.includes(target) || target.includes(name));
  });
  const candidates = named.length ? named : items;
  if (!candidates.length) return null;
  if (lat === null || lon === null) return candidates[0];
  return candidates.reduce((best, item) => {
    const itemLat = numberValue(firstValue(item, ["lat", "latitude"]));
    const itemLon = numberValue(firstValue(item, ["lot", "lon", "lng", "longitude"]));
    if (itemLat === null || itemLon === null) return best;
    const distance = Math.hypot(itemLat - lat, itemLon - lon);
    if (!best) return { item, distance };
    return distance < best.distance ? { item, distance } : best;
  }, null)?.item || candidates[0];
};

const gradeFromValue = (value, score) => {
  const text = String(value || "");
  if (text.includes("매우좋") || text.includes("좋음")) return "good";
  if (text.includes("보통")) return "fair";
  if (text.includes("나쁨") || text.includes("매우나쁨")) return "poor";
  if (score === null) return null;
  return score >= 70 ? "good" : score >= 40 ? "fair" : "poor";
};

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ code: "METHOD_NOT_ALLOWED", message: "GET 요청만 지원합니다." });

  const serviceKey = process.env.DATA_GO_SERVICE_KEY || process.env.SURF_API_KEY;
  if (!serviceKey) return res.status(503).json({ code: "API_NOT_CONFIGURED", message: "서핑 API 키가 설정되지 않았습니다." });

  const query = req.query || {};
  const targetLat = numberValue(query.lat);
  const targetLon = numberValue(query.lon);
  const params = new URLSearchParams({
    serviceKey,
    type: "json",
    reqDate: query.reqDate || new Date().toISOString().slice(0, 10).replace(/-/g, ""),
    pageNo: "1",
    numOfRows: "300",
  });
  if (query.placeCode) params.set("placeCode", query.placeCode);

  try {
    const upstream = await fetch(`${API_URL}?${params.toString()}`);
    const payload = await upstream.json();
    const resultCode = String(payload?.response?.header?.resultCode || payload?.header?.resultCode || "");
    if (!upstream.ok || (resultCode && resultCode !== "00")) {
      return res.status(upstream.status >= 400 ? upstream.status : 502).json({ code: "UPSTREAM_ERROR", message: payload?.response?.header?.resultMsg || payload?.header?.resultMsg || "서핑 API 응답 오류입니다." });
    }

    const item = findSpot(getItems(payload), query.spot, targetLat, targetLon);
    if (!item) return res.status(404).json({ code: "SPOT_NOT_FOUND", message: "해당 스팟의 서핑지수를 찾을 수 없습니다." });

    const rawScore = numberValue(firstValue(item, ["srfScore", "surfScore", "surfingScore", "score"]));
    const score = rawScore !== null && rawScore <= 5 ? Math.round(rawScore * 20) : rawScore;
    const windMps = numberValue(firstValue(item, ["avgWspd", "ws", "windSpeed", "wind_speed", "wind"]));
    const gradeValue = firstValue(item, ["totalIndex", "GrdCn", "grdCn", "grade", "srfIdx", "surfingIndex"]);
    const data = {
      wave: numberValue(firstValue(item, ["avgWvhgt", "wvhgt", "waveHeight", "wave_height", "wave"])),
      wind: windMps === null ? null : Math.round(windMps * 3.6 * 10) / 10,
      period: numberValue(firstValue(item, ["avgWvpd", "wvprid", "wavePeriod", "wave_period", "period"])),
      waterTemp: numberValue(firstValue(item, ["avgWtem", "wtemp", "waterTemp", "water_temperature"])),
      score,
      grade: gradeFromValue(gradeValue, score),
      checkedAt: `${firstValue(item, ["predcYmd", "anlsYmd", "analysisDate", "reqDate"]) || ""} ${firstValue(item, ["predcNoonSeCd", "anlsHr", "analysisTime"]) || ""}`.trim(),
      source: "khoa",
    };
    return res.status(200).json({ data });
  } catch (error) {
    return res.status(502).json({ code: "UPSTREAM_UNAVAILABLE", message: "서핑 API에 연결할 수 없습니다." });
  }
};
