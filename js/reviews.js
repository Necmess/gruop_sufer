(function (S) {
  S.openSpotModal = function (spotId) {
    const spot = S.SPOTS.find((item) => item.id === spotId);
    const data = S.state.data[spotId] || { status: "loading" };
    const reviews = S.REVIEWS[spotId] || [];
    const isFav = S.state.favorites.includes(spotId);
    let metrics = `<div class="detail-metric"><span>상태</span><b>불러오는 중...</b></div>`;
    if (data.status === "ok") metrics = `<div class="detail-metric"><span>${data.source === "khoa" ? "서핑지수" : "서핑 점수"}</span><b class="${data.grade}">${data.score == null ? S.gradeLabel(data.grade) : `${data.score} (${S.gradeLabel(data.grade)})`}</b></div><div class="detail-metric"><span>파고</span><b>${data.wave == null ? "-" : `${data.wave.toFixed(1)}m`}</b></div><div class="detail-metric"><span>바람</span><b>${data.wind == null ? "-" : `${Math.round(data.wind)}km/h`}</b></div><div class="detail-metric"><span>기온</span><b>${data.temperature == null ? "-" : `${Math.round(data.temperature)}℃`}</b></div><div class="detail-metric"><span>날씨</span><b>${data.weatherLabel || "-"}</b></div><div class="detail-metric"><span>지역</span><b>${spot.region}</b></div>`;
    else if (data.status === "error") metrics = `<div class="detail-metric" style="grid-column:1/-1"><span>오류</span><b>${data.message}</b></div>`;
    else if (data.status === "empty") metrics = `<div class="detail-metric" style="grid-column:1/-1"><span>알림</span><b>데이터 없음</b></div>`;
    document.getElementById("spotModalContent").innerHTML = `<button class="modal-close" data-close="spotModal" aria-label="스팟 상세 모달 닫기">✕</button><div style="display:flex;justify-content:space-between;align-items:flex-start"><div><h2 id="spotModalTitle">${spot.name}</h2><div class="spot-region">${spot.region}</div></div><button class="fav-star ${isFav ? "active" : ""}" data-fav="${spot.id}" style="font-size:1.6rem" aria-label="${spot.name} 즐겨찾기">★</button></div><p style="color:var(--muted);margin:10px 0 18px">${spot.desc}</p><div class="spot-detail-grid">${metrics}</div><div class="detail-reviews"><h4>스팟 리뷰</h4>${reviews.length ? reviews.map((review) => `<div class="review-card"><div class="rv-top"><span>${review.user}</span><span>${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</span></div><p>${review.text}</p></div>`).join("") : `<p style="color:var(--muted)">아직 등록된 리뷰가 없습니다.</p>`}</div>`;
    document.querySelector("#spotModalContent .modal-close").addEventListener("click", () => document.getElementById("spotModal").classList.remove("open"));
    document.getElementById("spotModal").classList.add("open");
    document.querySelector("#spotModalContent .modal-close").focus();
  };

  S.setupModals = function () {
    const openLesson = () => {
      document.getElementById("lessonModal").classList.add("open");
      document.querySelector("#lessonModal .modal-close").focus();
    };
    document.querySelectorAll("[data-close]").forEach((element) => element.addEventListener("click", () => document.getElementById(element.getAttribute("data-close")).classList.remove("open")));
    document.getElementById("openLessonNav").addEventListener("click", (event) => { event.preventDefault(); openLesson(); });
    document.getElementById("openLessonHero").addEventListener("click", openLesson);
    document.getElementById("openLessonMobile").addEventListener("click", (event) => { event.preventDefault(); document.getElementById("mobileMenu").classList.remove("open"); openLesson(); });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      document.querySelectorAll(".modal.open").forEach((modal) => modal.classList.remove("open"));
    });
  };
})(window.SurfKorea);
