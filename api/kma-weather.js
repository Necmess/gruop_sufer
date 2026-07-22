const API_URL = "https://apihub.kma.go.kr/api/typ01/cgi-bin/url/nph-dfs_shrt_grd";
const GRID_WIDTH = 149;
const GRID_HEIGHT = 253;

const numberValue = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const getKstParts = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date).reduce((result, part) => {
    if (part.type !== "literal") result[part.type] = part.value;
    return result;
  }, {});
  return {
    date: `${parts.year}${parts.month}${parts.day}`,
    hour: Number(parts.hour),
  };
};

const shiftDate = (dateText, days) => {
  const year = Number(dateText.slice(0, 4));
  const month = Number(dateText.slice(4, 6));
  const day = Number(dateText.slice(6, 8));
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}${String(date.getUTCDate()).padStart(2, "0")}`;
};

// 기상청 단기예보 격자 좌표 변환(Lambert Conformal Conic)
const toGrid = (lat, lon) => {
  const RE = 6371.00877;
  const GRID = 5;
  const SLAT1 = 30;
  const SLAT2 = 60;
  const OLON = 126;
  const OLAT = 38;
  const XO = 43;
  const YO = 136;
  const rad = Math.PI / 180;
  const sn = Math.log(Math.cos(SLAT1 * rad) / Math.cos(SLAT2 * rad))
    / Math.log(Math.tan(Math.PI / 4 + SLAT2 * rad / 2) / Math.tan(Math.PI / 4 + SLAT1 * rad / 2));
  const sf = Math.pow(Math.tan(Math.PI / 4 + SLAT1 * rad / 2), sn) * Math.cos(SLAT1 * rad) / sn;
  const ro = RE / GRID * sf / Math.pow(Math.tan(Math.PI / 4 + OLAT * rad / 2), sn);
  const ra = RE / GRID * sf / Math.pow(Math.tan(Math.PI / 4 + lat * rad / 2), sn);
  const theta = (lon - OLON) * rad * sn;
  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  };
};

const parseGrid = (text) => text
  .trim()
  .split(/[,\s]+/)
  .filter((value) => value !== "")
  .map(Number)
  .filter(Number.isFinite);

const readGridValue = (values, nx, ny) => {
  if (nx < 1 || nx > GRID_WIDTH || ny < 1 || ny > GRID_HEIGHT) return null;
  const value = values[(ny - 1) * GRID_WIDTH + (nx - 1)];
  return value == null || value <= -90 ? null : value;
};

const findNearestGridValue = (values, nx, ny, maxRadius = 3) => {
  for (let radius = 0; radius <= maxRadius; radius += 1) {
    const candidates = [];
    for (let dx = -radius; dx <= radius; dx += 1) {
      for (let dy = -radius; dy <= radius; dy += 1) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
        candidates.push({ nx: nx + dx, ny: ny + dy, distance: Math.hypot(dx, dy) });
      }
    }
    candidates.sort((a, b) => a.distance - b.distance);
    for (const candidate of candidates) {
      const value = readGridValue(values, candidate.nx, candidate.ny);
      if (value !== null) return { ...candidate, value };
    }
  }
  return null;
};

const getForecastTargets = (date = new Date()) => {
  const { date: today, hour } = getKstParts(date);
  const targetDate = hour === 23 ? shiftDate(today, 1) : today;
  const targetHour = String((hour + 1) % 24).padStart(2, "0");
  const releaseHours = [23, 20, 17, 14, 11, 8, 5, 2];
  const targets = [];
  releaseHours.forEach((releaseHour) => {
    if (releaseHour <= hour) targets.push({ tmfc: `${today}${String(releaseHour).padStart(2, "0")}`, tmef: `${targetDate}${targetHour}` });
  });
  if (!targets.length) targets.push({ tmfc: `${shiftDate(today, -1)}23`, tmef: `${today}${targetHour}` });
  return targets;
};

const fetchForecast = async (serviceKey, target, variable) => {
  const params = new URLSearchParams({
    tmfc: target.tmfc,
    tmef: target.tmef,
    vars: variable,
    authKey: serviceKey,
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${API_URL}?${params.toString()}`, { signal: controller.signal });
    const text = await response.text();
    if (!response.ok) return null;
    const values = parseGrid(text);
    return values.length >= GRID_WIDTH * GRID_HEIGHT ? { values, target } : null;
  } finally {
    clearTimeout(timer);
  }
};

const weatherLabel = (sky, pty) => {
  if (pty === 1) return "비";
  if (pty === 2) return "비 또는 눈";
  if (pty === 3) return "눈";
  if (pty === 4) return "소나기";
  if (sky === 1) return "맑음";
  if (sky === 3) return "구름 조금";
  if (sky === 4) return "흐림";
  return null;
};

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ code: "METHOD_NOT_ALLOWED", message: "GET 요청만 지원합니다." });

  const serviceKey = process.env.KMA_SERVICE_KEY || process.env.KMA_API_KEY;
  if (!serviceKey) return res.status(503).json({ code: "API_NOT_CONFIGURED", message: "기상청 API 키가 설정되지 않았습니다." });

  const lat = numberValue(req.query?.lat);
  const lon = numberValue(req.query?.lon);
  if (lat === null || lon === null || lat < 30 || lat > 45 || lon < 120 || lon > 135) {
    return res.status(400).json({ code: "INVALID_COORDINATES", message: "유효한 서핑 지역 좌표가 필요합니다." });
  }

  try {
    const grid = toGrid(lat, lon);
    let forecasts = null;
    let resolvedGrid = null;
    for (const target of getForecastTargets()) {
      const temperatureForecast = await fetchForecast(serviceKey, target, "TMP");
      const temperatureAtGrid = temperatureForecast && findNearestGridValue(temperatureForecast.values, grid.nx, grid.ny);
      if (temperatureForecast && temperatureAtGrid) {
        const [skyForecast, precipitationForecast] = await Promise.all([
          fetchForecast(serviceKey, target, "SKY"),
          fetchForecast(serviceKey, target, "PTY"),
        ]);
        forecasts = { temperatureForecast, skyForecast, precipitationForecast };
        resolvedGrid = temperatureAtGrid;
        break;
      }
    }
    if (!forecasts) return res.status(502).json({ code: "UPSTREAM_EMPTY", message: "기상청 기상자료를 확인할 수 없습니다." });

    const temperature = resolvedGrid?.value ?? null;
    const sky = readGridValue(forecasts.skyForecast?.values || [], resolvedGrid.nx, resolvedGrid.ny);
    const precipitation = readGridValue(forecasts.precipitationForecast?.values || [], resolvedGrid.nx, resolvedGrid.ny);
    if (temperature === null) return res.status(404).json({ code: "GRID_VALUE_EMPTY", message: "해당 지역의 기온 자료가 없습니다." });

    return res.status(200).json({
      data: {
        temperature,
        weatherLabel: weatherLabel(sky, precipitation),
        sky,
        precipitation,
        grid,
        resolvedGrid: { nx: resolvedGrid.nx, ny: resolvedGrid.ny },
        usedNearbyGrid: resolvedGrid.nx !== grid.nx || resolvedGrid.ny !== grid.ny,
        forecastAt: `${forecasts.temperatureForecast.target.tmef.slice(0, 4)}-${forecasts.temperatureForecast.target.tmef.slice(4, 6)}-${forecasts.temperatureForecast.target.tmef.slice(6, 8)} ${forecasts.temperatureForecast.target.tmef.slice(8)}:00`,
        source: "kma",
      },
    });
  } catch (error) {
    if (error?.name === "AbortError") return res.status(504).json({ code: "UPSTREAM_TIMEOUT", message: "기상청 응답 시간이 초과되었습니다." });
    return res.status(502).json({ code: "UPSTREAM_UNAVAILABLE", message: "기상청 API에 연결할 수 없습니다." });
  }
};
