import HomePage from "../pages/home/home-page";
import LoginPage from "../pages/auth/login-page.js";
import RegisterPage from "../pages/auth/register-page.js";
import AddStoryPage from "../pages/add/add-story-page";
import BookmarkPage from "../pages/bookmark/bookmark-page.js";

const routes = {
  "/": new HomePage(),
  "/login": new LoginPage(),
  "/register": new RegisterPage(),
  "/add": new AddStoryPage(),
  "/bookmark": new BookmarkPage(),
};

export default routes;
