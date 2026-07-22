(function (S) {
  S.toast = function (msg, ms = 2600) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(S.toast.timer);
    S.toast.timer = setTimeout(() => el.classList.remove("show"), ms);
  };

  S.saveFavorites = function () {
    try {
      localStorage.setItem("sk_favorites", JSON.stringify(S.state.favorites));
    } catch (error) {
      S.toast("즐겨찾기를 저장하지 못했습니다.");
    }
  };

  S.gradeFromScore = (score) => score >= 70 ? "good" : score >= 40 ? "fair" : "poor";
  S.gradeLabel = (grade) => ({ good: "좋음", fair: "보통", poor: "나쁨" }[grade] || "정보없음");

  S.setAuthUI = function () {
    const label = S.state.loggedIn ? "마이페이지" : "로그인";
    const loginBtn = document.getElementById("loginBtn");
    const mobileLoginBtn = document.getElementById("mobileLoginBtn");
    if (loginBtn) loginBtn.textContent = label;
    if (mobileLoginBtn) mobileLoginBtn.textContent = label;
  };
})(window.SurfKorea);
