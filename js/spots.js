(function (S) {
  S.cardHtml = function (spot) {
    const d = S.state.data[spot.id] || { status: "loading" };
    const isFav = S.state.favorites.includes(spot.id);
    const reviews = (S.REVIEWS[spot.id] || []).slice(0, 2);
    let body = "";
    if (d.status === "loading") body = `<div class="skel skel-badge"></div><div class="skel skel-line" style="width:70%"></div><div class="skel skel-line" style="width:50%"></div>`;
    else if (d.status === "error") {
      body = `<div class="card-state error"><p>${d.message}</p><button class="btn btn-outline btn-sm retry-btn" data-retry="${spot.id}">다시 시도</button></div>`;
    } else if (d.status === "empty") body = `<div class="card-state"><p>현재 확인할 수 있는 데이터가 없습니다.</p></div>`;
    else if (d.status === "ok") { const sourceLabel = d.source === "khoa" ? `국립해양조사원 서핑지수${d.checkedAt ? ` · ${d.checkedAt} 기준` : ""}` : "파고와 바람 기준"; const scoreLabel = d.source === "khoa" ? "서핑지수" : "오늘의 컨디션"; const scoreText = d.score == null ? S.gradeLabel(d.grade) : d.score; body = `<div class="score-row"><div class="score-badge ${d.grade}">${scoreText}</div><div class="score-meta"><div class="score-label ${d.grade}">${scoreLabel} · ${S.gradeLabel(d.grade)}</div><div>${sourceLabel}</div></div></div><div class="metrics-row"><div class="metric">파고<br><b>${d.wave != null ? d.wave.toFixed(1) + "m" : "-"}</b></div><div class="metric">바람<br><b>${d.wind != null ? Math.round(d.wind) + "km/h" : "-"}</b></div><div class="metric">기온<br><b>${d.temperature != null ? Math.round(d.temperature) + "℃" : "-"}</b></div></div>${d.weatherLabel ? `<div class="weather-caption">날씨 예보 · ${d.weatherLabel}</div>` : ""}${reviews.length ? `<div class="card-reviews"><h4>최근 후기</h4>${reviews.map((review) => `<div class="review-line"><b>${"★".repeat(review.rating)}</b> ${review.text}</div>`).join("")}</div>` : ""}`; }

    const favoriteLabel = isFav ? "즐겨찾기에서 제거" : "즐겨찾기에 저장";
    return `<article class="spot-card" data-id="${spot.id}" role="button" tabindex="0" aria-label="${spot.name} 상세 조건 보기"><div class="spot-card-image"><img src="${spot.image}" alt="${spot.name} 바다 풍경" loading="lazy" onerror="this.parentElement.classList.add('image-fallback');this.style.display='none'"><span class="image-location">${spot.region}</span><button class="fav-star image-fav ${isFav ? "active" : ""}" data-fav="${spot.id}" title="${favoriteLabel}" aria-label="${spot.name} ${favoriteLabel}">★</button></div><div class="spot-card-top"><div><h3>${spot.name}</h3></div></div>${body}</article>`;
  };

  S.visibleSpots = function () {
    const term = S.state.search.trim().toLowerCase();
    return S.SPOTS.filter((spot) => {
      if (S.state.showFavOnly && !S.state.favorites.includes(spot.id)) return false;
      return !term || spot.name.toLowerCase().includes(term) || spot.region.toLowerCase().includes(term);
    });
  };

  S.renderCards = function () {
    const list = S.visibleSpots();
    const count = document.getElementById("cardsCount");
    if (count) count.textContent = S.state.showFavOnly ? `즐겨찾기 ${list.length}곳` : `전국 스팟 ${list.length}곳`;
    const emptyMessage = S.state.showFavOnly && !S.state.search ? "저장한 즐겨찾기 스팟이 없습니다." : "검색 결과가 없습니다.";
    document.getElementById("cardsGrid").innerHTML = list.length ? list.map(S.cardHtml).join("") : `<div class="card-state" style="grid-column:1/-1">${emptyMessage}</div>`;
  };

  S.updateStatusBar = function () {
    const bar = document.getElementById("statusBar");
    const messages = {
      normal: null,
      slow: { cls: "info", text: "응답이 평소보다 늦어지고 있습니다. 잠시만 기다려주세요." },
      fail: { cls: "error", text: "네트워크 오류로 일부 정보를 불러오지 못했습니다." },
      empty: { cls: "warn", text: "현재 조회할 수 있는 스팟 정보가 없습니다." },
      auth: { cls: "error", text: "데이터 인증에 문제가 있습니다. 잠시 후 다시 시도해주세요." },
      ratelimit: { cls: "warn", text: "요청이 잠시 많습니다. 조금 뒤 다시 시도해주세요." },
    };
    const message = messages[S.state.simMode];
    if (!message) { bar.style.display = "none"; return; }
    bar.style.display = "flex";
    bar.className = "status-bar " + message.cls;
    bar.textContent = message.text;
  };

  S.updateTodayHighlight = function () {
    const available = S.SPOTS.map((spot) => ({ spot, data: S.state.data[spot.id] })).filter(({ data }) => data?.status === "ok");
    const recommend = document.querySelector("#todayRecommend .today-body");
    const avoid = document.querySelector("#todayAvoid .today-body");
    if (!available.length) {
      recommend.textContent = "데이터를 불러오는 중이거나 이용할 수 없습니다.";
      avoid.textContent = "데이터를 불러오는 중이거나 이용할 수 없습니다.";
      return;
    }
    const best = available.reduce((a, b) => b.data.rankScore > a.data.rankScore ? b : a);
    const worst = available.reduce((a, b) => b.data.rankScore < a.data.rankScore ? b : a);
    const waveText = (value) => value == null ? "-" : `${value.toFixed(1)}m`;
    const windText = (value) => value == null ? "-" : `${Math.round(value)}km/h`;
    const conditionText = (item) => `${item.data.source === "khoa" ? `서핑지수 ${S.gradeLabel(item.data.grade)}` : `컨디션 점수 ${item.data.score}`} · 파고 ${waveText(item.data.wave)} · 바람 ${windText(item.data.wind)}`;
    recommend.innerHTML = `<b>${best.spot.name}</b> (${best.spot.region})<span class="sub">${conditionText(best)}</span>`;
    avoid.innerHTML = (worst.data.source === "khoa" ? worst.data.grade === "poor" : worst.data.score < 40) ? `<b>${worst.spot.name}</b> (${worst.spot.region})<span class="sub">${conditionText(worst)}</span>` : "오늘은 대부분의 스팟에서 서핑을 즐길 수 있어요.";
  };

  S.setupSearchAndFav = function () {
    const input = document.getElementById("searchInput");
    const mobileInput = document.getElementById("mobileSearchInput");
    const updateSearch = (value, source) => { S.state.search = value; input.value = source === input ? value : input.value; if (mobileInput) mobileInput.value = source === mobileInput ? value : mobileInput.value; S.renderCards(); };
    input.addEventListener("input", () => updateSearch(input.value, input));
    if (mobileInput) mobileInput.addEventListener("input", () => updateSearch(mobileInput.value, mobileInput));
    document.getElementById("searchClearBtn").addEventListener("click", () => { input.value = ""; if (mobileInput) mobileInput.value = ""; S.state.search = ""; S.renderCards(); });
    document.getElementById("favToggleBtn").addEventListener("click", (event) => { S.state.showFavOnly = !S.state.showFavOnly; event.currentTarget.classList.toggle("btn-primary", S.state.showFavOnly); event.currentTarget.textContent = S.state.showFavOnly ? "전체 스팟 보기" : "즐겨찾기 스팟"; S.renderCards(); });
  };

  S.setupCardDelegation = function () {
    document.body.addEventListener("click", (event) => {
      const favoriteButton = event.target.closest("[data-fav]");
      if (favoriteButton) {
        const id = favoriteButton.getAttribute("data-fav");
        const index = S.state.favorites.indexOf(id);
        if (index === -1) { S.state.favorites.push(id); S.toast("즐겨찾기에 추가했습니다."); }
        else { S.state.favorites.splice(index, 1); S.toast("즐겨찾기에서 제거했습니다"); }
        S.saveFavorites(); S.renderCards(); S.renderMyPage();
        document.querySelectorAll(`#cardsGrid [data-fav="${id}"], #favoriteGrid [data-fav="${id}"]`).forEach((button) => {
          button.classList.remove("favorite-pop");
          void button.offsetWidth;
          button.classList.add("favorite-pop");
          button.addEventListener("animationend", () => button.classList.remove("favorite-pop"), { once: true });
        });
        const modalStar = document.querySelector(`#spotModalContent [data-fav="${id}"]`);
        if (modalStar) {
          modalStar.classList.toggle("active", S.state.favorites.includes(id));
          modalStar.classList.add("favorite-pop");
          modalStar.addEventListener("animationend", () => modalStar.classList.remove("favorite-pop"), { once: true });
        }
        return;
      }
      const retryButton = event.target.closest("[data-retry]");
      if (retryButton) { S.loadSpot(S.SPOTS.find((spot) => spot.id === retryButton.getAttribute("data-retry"))); return; }
      const card = event.target.closest(".spot-card");
      if (card) { S.openSpotModal(card.getAttribute("data-id")); return; }
      const favoriteCard = event.target.closest(".favorite-mini-card");
      if (favoriteCard) { S.openSpotModal(favoriteCard.getAttribute("data-id")); return; }
      if (event.target.closest("#emptyGoSpotBtn")) { S.switchView("home"); document.getElementById("spots").scrollIntoView({ behavior: "smooth" }); }
    });
    document.body.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (event.target.closest("[data-fav]")) return;
      const card = event.target.closest(".spot-card,.favorite-mini-card");
      if (!card) return;
      event.preventDefault();
      S.openSpotModal(card.getAttribute("data-id"));
    });
  };

  S.setupSim = function () {
    const simulator = document.getElementById("simSelect");
    const reloadButton = document.getElementById("reloadBtn");
    if (simulator) simulator.addEventListener("change", (event) => { S.state.simMode = event.target.value; S.loadAllSpots({ force: true }); });
    if (reloadButton) reloadButton.addEventListener("click", () => S.loadAllSpots({ force: true }));
  };
})(window.SurfKorea);
