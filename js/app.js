(function (S) {
  S.loadSections = async function () {
    const sectionPaths = ["sections/home.html", "sections/mypage.html", "sections/market.html"];
    const responses = await Promise.all(sectionPaths.map((path) => fetch(path)));
    if (responses.some((response) => !response.ok)) throw new Error("페이지 섹션을 불러오지 못했습니다.");
    const markup = await Promise.all(responses.map((response) => response.text()));
    document.getElementById("app-sections").innerHTML = markup.join("\n");
  };

  document.addEventListener("DOMContentLoaded", async () => {
    const loader = document.getElementById("sectionLoader");
    try {
      await S.loadSections();
      loader.classList.add("hidden");
    } catch (error) {
      loader.innerHTML = `<p>화면을 불러오지 못했습니다.</p><small>로컬 서버에서 실행해주세요: python3 -m http.server</small><button class="btn btn-ghost btn-sm" id="retrySections">다시 시도</button>`;
      document.getElementById("retrySections").addEventListener("click", () => window.location.reload());
      console.error(error);
      return;
    }
    S.setAuthUI();
    S.setupNav();
    S.setupModals();
    S.setupMarket();
    S.setupSearchAndFav();
    S.setupCardDelegation();
    S.setupSim();
    try {
      S.initMap();
    } catch (error) {
      S.showMapError("지도를 연결할 수 없습니다.");
      console.error(error);
    }
    S.loadAllSpots();
    S.startAutoRefresh();
    S.renderMyPage();
    const initialView = new URLSearchParams(window.location.search).get("view");
    if (initialView === "mypage" && S.state.loggedIn) {
      S.switchView("mypage");
      S.renderMyPage();
    }
  });
})(window.SurfKorea);
