(function () {
  const apiBase = () => window.location.origin;

  function saveSession(user) {
    sessionStorage.setItem("sk_user", JSON.stringify(user));
    sessionStorage.removeItem("sk_logged_in");
  }

  function setAuthMode(mode) {
    const isLogin = mode === "login";
    document.getElementById("loginForm").hidden = !isLogin;
    document.getElementById("registerForm").hidden = isLogin;
    document.getElementById("showLoginTab").classList.toggle("active", isLogin);
    document.getElementById("showRegisterTab").classList.toggle("active", !isLogin);
    document.getElementById("authTitle").textContent = isLogin ? "다시, 파도 안으로" : "함께 파도 타기";
    document.getElementById("authSub").textContent = isLogin
      ? "즐겨찾기한 스팟과 나만의 서핑 기록을 확인하세요."
      : "팀원과 같은 Atlas DB 계정으로 로그인할 수 있어요.";
    document.getElementById("loginError").textContent = "";
    document.getElementById("registerError").textContent = "";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const username = document.getElementById("username");
    const password = document.getElementById("password");
    const loginError = document.getElementById("loginError");
    const registerError = document.getElementById("registerError");

    document.getElementById("showLoginTab").addEventListener("click", () => setAuthMode("login"));
    document.getElementById("showRegisterTab").addEventListener("click", () => setAuthMode("register"));

    username.focus();

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      loginError.textContent = "";

      try {
        const response = await fetch(`${apiBase()}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.value.trim(),
            password: password.value,
          }),
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.message || "로그인에 실패했습니다.");

        saveSession(payload.user);
        window.location.href = "index.html?view=mypage";
      } catch (error) {
        loginError.textContent = error.message || "서버와 연결할 수 없습니다. npm start 후 3000번 포트로 접속해 주세요.";
        password.focus();
      }
    });

    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      registerError.textContent = "";

      const registerUsername = document.getElementById("registerUsername").value.trim();
      const registerDisplayName = document.getElementById("registerDisplayName").value.trim();
      const registerPassword = document.getElementById("registerPassword").value;
      const registerPasswordConfirm = document.getElementById("registerPasswordConfirm").value;

      if (registerPassword !== registerPasswordConfirm) {
        registerError.textContent = "비밀번호 확인이 일치하지 않습니다.";
        return;
      }

      try {
        const response = await fetch(`${apiBase()}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: registerUsername,
            password: registerPassword,
            displayName: registerDisplayName,
          }),
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.message || "회원가입에 실패했습니다.");

        saveSession(payload.user);
        window.location.href = "index.html?view=mypage";
      } catch (error) {
        registerError.textContent = error.message || "서버와 연결할 수 없습니다. npm start 후 3000번 포트로 접속해 주세요.";
      }
    });
  });
})();
