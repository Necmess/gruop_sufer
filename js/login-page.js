(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const username = document.getElementById("username");
    const password = document.getElementById("password");
    const error = document.getElementById("loginError");

    username.focus();
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (username.value.trim() !== "admin" || password.value !== "admin") {
        error.textContent = "아이디 또는 비밀번호를 다시 확인해주세요.";
        password.focus();
        return;
      }
      error.textContent = "";
      sessionStorage.setItem("sk_logged_in", "true");
      window.location.href = "index.html?view=mypage";
    });
  });
})();
