(function (S) {
  S.renderMyPage = function () {
    const grid = document.getElementById("favoriteGrid");
    if (!grid) return;

    const usernameEl = document.getElementById("mypageUsername");
    if (usernameEl) {
      usernameEl.textContent = S.state.user?.displayName || S.state.user?.username || "서퍼";
    }

    const favoriteSpots = S.SPOTS.filter((spot) => S.state.favorites.includes(spot.id));
    document.getElementById("favoriteCount").textContent = favoriteSpots.length;
    document.getElementById("lastChecked").textContent = new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric" }).format(new Date());
    const available = S.SPOTS.map((spot) => ({ spot, data: S.state.data[spot.id] })).filter(({ data }) => data?.status === "ok").sort((a, b) => b.data.rankScore - a.data.rankScore);
    document.getElementById("myRecommend").textContent = available[0] ? available[0].spot.name.replace(/해변|색달/g, "") : "-";
    if (!favoriteSpots.length) {
      grid.innerHTML = `<div class="favorite-empty"><span class="empty-wave">✦</span><h3>아직 저장한 스팟이 없어요</h3><p>마음에 드는 스팟의 별표를 눌러<br>나만의 서핑 리스트를 만들어보세요.</p><button class="btn btn-primary btn-sm" id="emptyGoSpotBtn">스팟 둘러보기</button></div>`;
      return;
    }
    grid.innerHTML = favoriteSpots.map((spot) => {
      const data = S.state.data[spot.id];
      const waveText = data?.wave == null ? "-" : `${data.wave.toFixed(1)}m`;
      const condition = data?.status === "ok" ? `<b class="${data.grade}">${data.score == null ? S.gradeLabel(data.grade) : data.score}</b><span>${S.gradeLabel(data.grade)} · 파고 ${waveText}</span>` : `<b class="na-score">-</b><span>정보 확인 필요</span>`;
      return `<article class="favorite-mini-card" data-id="${spot.id}" role="button" tabindex="0" aria-label="${spot.name} 상세 조건 보기"><img src="${spot.image}" alt="${spot.name}" onerror="this.style.display='none'"><div class="favorite-mini-copy"><span>${spot.region}</span><h3>${spot.name}</h3><div class="mini-condition">${condition}</div></div><button class="fav-star active" data-fav="${spot.id}" aria-label="즐겨찾기 해제">★</button></article>`;
    }).join("");
  };
})(window.SurfKorea);
