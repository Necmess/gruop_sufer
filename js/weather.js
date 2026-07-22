(function (S) {
  S.computeScore = function (waveHeight, windSpeedKmh) {
    let waveScore;
    if (waveHeight == null) waveScore = 0;
    else if (waveHeight < 0.2) waveScore = 10;
    else if (waveHeight <= 0.8) waveScore = 40 + (waveHeight - 0.2) / 0.6 * 40;
    else if (waveHeight <= 1.6) waveScore = 100 - Math.abs(waveHeight - 1.2) * 25;
    else if (waveHeight <= 2.5) waveScore = Math.max(20, 90 - (waveHeight - 1.6) * 45);
    else waveScore = 15;

    let windScore;
    if (windSpeedKmh == null) windScore = 0;
    else if (windSpeedKmh <= 10) windScore = 100;
    else if (windSpeedKmh <= 20) windScore = 100 - (windSpeedKmh - 10) * 4;
    else if (windSpeedKmh <= 35) windScore = 60 - (windSpeedKmh - 20) * 3;
    else windScore = 10;
    return Math.round(Math.max(0, Math.min(100, waveScore * 0.6 + windScore * 0.4)));
  };

  S.fetchWithTimeout = async function (url, timeoutMs = 10000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { signal: controller.signal });
    } catch (error) {
      if (error.name === "AbortError") throw { type: "network", message: "API 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요." };
      throw error;
    } finally {
      clearTimeout(timer);
    }
  };

  S.fetchOfficialSurfCondition = async function (spot) {
    const params = new URLSearchParams({ spot: spot.name, lat: spot.lat, lon: spot.lon });
    const response = await S.fetchWithTimeout(`/api/surfing?${params.toString()}`);
    if (response.status === 404) return null;
    let payload = null;
    try { payload = await response.json(); } catch (error) { payload = null; }
    if (payload?.code === "API_NOT_CONFIGURED") return null;
    if (!response.ok) throw { type: "network", message: payload?.message || `서핑 API 호출 실패 (HTTP ${response.status})` };
    return payload?.data || null;
  };

  S.fetchKmaWeather = async function (spot) {
    const params = new URLSearchParams({ lat: spot.lat, lon: spot.lon });
    const response = await S.fetchWithTimeout(`/api/kma-weather?${params.toString()}`);
    if (response.status === 404) return null;
    let payload = null;
    try { payload = await response.json(); } catch (error) { payload = null; }
    if (payload?.code === "API_NOT_CONFIGURED" || payload?.code === "GRID_VALUE_EMPTY") return null;
    if (!response.ok) throw { type: "network", message: payload?.message || `기상청 API 호출 실패 (HTTP ${response.status})` };
    return payload?.data || null;
  };

  S.fetchSpotConditions = async function (spot, { force = false } = {}) {
    const mode = S.state.simMode;
    if (mode === "slow") await new Promise((resolve) => setTimeout(resolve, 3200));
    if (mode === "fail") throw { type: "network", message: "네트워크 오류로 데이터를 불러올 수 없습니다." };
    if (mode === "auth") throw { type: "auth", message: "API 인증키가 유효하지 않습니다 (401)." };
    if (mode === "ratelimit") throw { type: "ratelimit", message: "요청 한도를 초과했습니다 (429). 잠시 후 다시 시도해주세요." };
    if (mode === "empty") return { wave: null, wind: null, empty: true };
    const cached = S.state.conditionsCache[spot.id];
    const cacheHasWeather = cached?.value?.source !== "khoa" || Object.prototype.hasOwnProperty.call(cached?.value || {}, "weatherSource");
    if (!force && mode === "normal" && cached?.value?.source && cacheHasWeather && Date.now() - cached.savedAt < 5 * 60 * 1000) return cached.value;

    if (mode === "normal") {
      const official = await S.fetchOfficialSurfCondition(spot);
      if (official) {
        let weather = null;
        try { weather = await S.fetchKmaWeather(spot); } catch (error) { console.info("기상청 보조 데이터 생략", spot.name, error.message); }
        const value = { ...official, ...(weather || {}), source: official.source, weatherSource: weather?.source || null };
        S.state.conditionsCache[spot.id] = { savedAt: Date.now(), value };
        sessionStorage.setItem("sk_conditions_cache", JSON.stringify(S.state.conditionsCache));
        return value;
      }
    }
    if (!force && mode === "normal" && cached && Date.now() - cached.savedAt < 5 * 60 * 1000) return cached.value;

    const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${spot.lat}&longitude=${spot.lon}&hourly=wave_height&timezone=Asia%2FSeoul&forecast_days=1`;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${spot.lat}&longitude=${spot.lon}&hourly=wind_speed_10m&timezone=Asia%2FSeoul&forecast_days=1`;
    let marineRes, weatherRes;
    try {
      [marineRes, weatherRes] = await Promise.all([S.fetchWithTimeout(marineUrl), S.fetchWithTimeout(weatherUrl)]);
    } catch (error) {
      if (error?.type) throw error;
      throw { type: "network", message: "네트워크 연결에 실패했습니다." };
    }
    if (!marineRes.ok || !weatherRes.ok) {
      const status = !marineRes.ok ? marineRes.status : weatherRes.status;
      if (status === 401 || status === 403) throw { type: "auth", message: `API 인증 오류 (${status})` };
      if (status === 429) throw { type: "ratelimit", message: "요청 제한 초과 (429)" };
      throw { type: "network", message: `API 호출 실패 (HTTP ${status})` };
    }
    let marineJson, weatherJson;
    try {
      [marineJson, weatherJson] = await Promise.all([marineRes.json(), weatherRes.json()]);
    } catch (error) {
      throw { type: "network", message: "API 응답 형식을 읽을 수 없습니다." };
    }
    const waveArr = marineJson?.hourly?.wave_height;
    const windArr = weatherJson?.hourly?.wind_speed_10m;
    if (!waveArr || !windArr || !waveArr.length || !windArr.length) return { wave: null, wind: null, empty: true };
    const idx = Math.min(new Date().getHours(), waveArr.length - 1);
    const wave = waveArr[idx] ?? waveArr.find((value) => value != null);
    const wind = windArr[idx] ?? windArr.find((value) => value != null);
    const value = wave == null && wind == null ? { wave: null, wind: null, empty: true, source: "open-meteo" } : { wave, wind, source: "open-meteo" };
    if (mode === "normal") {
      S.state.conditionsCache[spot.id] = { savedAt: Date.now(), value };
      sessionStorage.setItem("sk_conditions_cache", JSON.stringify(S.state.conditionsCache));
    }
    return value;
  };

  S.renderSkeletonCards = function () {
    document.getElementById("cardsGrid").innerHTML = S.SPOTS.map((spot) => `<div class="spot-card" data-id="${spot.id}"><div class="spot-card-top"><div><div class="skel skel-line" style="width:140px"></div><div class="skel skel-line" style="width:90px;height:9px"></div></div></div><div class="skel skel-badge"></div></div>`).join("");
  };

  S.loadSpot = async function (spot, options = {}) {
    S.state.data[spot.id] = { status: "loading" };
    S.renderCards();
    try {
      const result = await S.fetchSpotConditions(spot, options);
      if (result.empty) S.state.data[spot.id] = { status: "empty" };
      else {
        const grade = result.grade || S.gradeFromScore(result.score ?? S.computeScore(result.wave, result.wind));
        const score = result.score ?? (result.source === "khoa" ? null : S.computeScore(result.wave, result.wind));
        const rankScore = score ?? ({ good: 3, fair: 2, poor: 1 }[grade] || 0);
        S.state.data[spot.id] = { status: "ok", wave: result.wave, wind: result.wind, score, rankScore, grade, period: result.period, waterTemp: result.waterTemp, temperature: result.temperature, weatherLabel: result.weatherLabel, forecastAt: result.forecastAt, checkedAt: result.checkedAt, source: result.source, weatherSource: result.weatherSource };
      }
    } catch (error) {
      S.state.data[spot.id] = { status: "error", errType: error.type || "network", message: error.message || "알 수 없는 오류가 발생했습니다." };
    }
    S.renderCards();
    S.updateMarker(spot.id);
    S.updateTodayHighlight();
    if (S.state.loggedIn) S.renderMyPage();
  };

  S.loadAllSpots = async function ({ force = false } = {}) {
    if (S.state.isRefreshing) return;
    S.state.isRefreshing = true;
    S.updateStatusBar();
    S.renderSkeletonCards();
    document.querySelector("#todayRecommend .today-body").innerHTML = `<div class="skel skel-line" style="width:70%;background:rgba(255,255,255,.3)"></div>`;
    document.querySelector("#todayAvoid .today-body").innerHTML = `<div class="skel skel-line" style="width:70%;background:rgba(255,255,255,.3)"></div>`;
    try {
      for (let index = 0; index < S.SPOTS.length; index += 2) {
        await Promise.allSettled(S.SPOTS.slice(index, index + 2).map((spot) => S.loadSpot(spot, { force })));
      }
    } finally {
      S.state.isRefreshing = false;
    }
  };

  S.startAutoRefresh = function () {
    if (S.state.autoRefreshTimer) clearInterval(S.state.autoRefreshTimer);
    const refresh = () => {
      if (!document.hidden) S.loadAllSpots({ force: true });
    };
    S.state.autoRefreshTimer = setInterval(refresh, 5 * 60 * 1000);
    if (S.state.autoRefreshBound) return;
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) refresh();
    });
    S.state.autoRefreshBound = true;
  };
})(window.SurfKorea);
