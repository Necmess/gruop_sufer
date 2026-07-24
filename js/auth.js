(function (S) {
  S.switchView = function (view) {
    document.querySelectorAll(".view").forEach((element) => element.classList.remove("active"));
    document.getElementById(`view-${view}`).classList.add("active");
    const navbar = document.getElementById("navbar");
    if (navbar) navbar.classList.toggle("scrolled", view !== "home" || window.scrollY > 40);
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    if (view === "market" && typeof S.loadProducts === "function") S.loadProducts();
  };

  S.goToLoginWithTransition = function () {
    if (S.state.loggedIn) { S.switchView("mypage"); S.renderMyPage(); return; }
    window.location.href = "login.html";
  };

  S.setupNav = function () {
    const navbar = document.getElementById("navbar");
    window.addEventListener("scroll", () => navbar.classList.toggle("scrolled", window.scrollY > 40 || !document.getElementById("view-home").classList.contains("active")));
    document.querySelectorAll("[data-view]").forEach((element) => element.addEventListener("click", (event) => {
      const view = element.getAttribute("data-view");
      if (!view) return;
      event.preventDefault();
      S.switchView(view);
      if (element.getAttribute("href") && element.getAttribute("href") !== "#home") document.querySelector(element.getAttribute("href"))?.scrollIntoView({ behavior: "smooth" });
    }));

    document.getElementById("loginBtn").addEventListener("click", S.goToLoginWithTransition);
    document.getElementById("navBurger").addEventListener("click", () => document.getElementById("mobileMenu").classList.toggle("open"));
    document.getElementById("mobileLoginBtn").addEventListener("click", () => { document.getElementById("mobileMenu").classList.remove("open"); S.goToLoginWithTransition(); });
    document.querySelectorAll("[data-scroll]").forEach((element) => element.addEventListener("click", () => document.getElementById("mobileMenu").classList.remove("open")));
    document.getElementById("backHomeBtn").addEventListener("click", () => S.switchView("home"));
    document.getElementById("logoutBtn").addEventListener("click", () => {
      S.state.loggedIn = false;
      S.state.user = null;
      sessionStorage.removeItem("sk_user");
      sessionStorage.removeItem("sk_logged_in");
      S.setAuthUI();
      S.switchView("home");
      S.toast("로그아웃되었습니다.");
    });
    document.getElementById("goSpotMapBtn").addEventListener("click", () => { S.switchView("home"); document.getElementById("spots").scrollIntoView({ behavior: "smooth" }); });
  };
})(window.SurfKorea);
