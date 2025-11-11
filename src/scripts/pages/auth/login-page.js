import { login } from "../../data/api.js";

export default class LoginPage {
  async render() {
    return `
      <section class="container">
        <h1>Login</h1>
        <form id="login-form" aria-label="Login Form">
          <label for="email">Email</label>
          <input id="email" type="email" required />

          <label for="password">Password</label>
          <input id="password" type="password" required />

          <button type="submit">Masuk</button>
          <p>Belum punya akun? <a href="#/register">Daftar</a></p>
        </form>
      </section>
    `;
  }

  async afterRender() {
    const form = document.querySelector("#login-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = form.querySelector("#email").value;
      const password = form.querySelector("#password").value;

      const result = await login(email, password);
      if (result.error) {
        alert("Login gagal: " + result.message);
      } else {
        localStorage.setItem("isLoggedIn", "true");
        if (result.loginResult?.token) {
          localStorage.setItem("token", result.loginResult.token);
        }
        alert("Login berhasil!");
        location.hash = "/";
      }
    });
  }
}
