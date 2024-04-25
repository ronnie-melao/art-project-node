import { Router } from "express";

let router = new Router();

router.route("/").get(async (req, res) => {
  res.render("home", { title: "Art Site" });
});

router.route("/login").get(async (req, res) => {
  // temporary dummy user for testing
  res.render("home", { title: "Art Site", user: {} });
});

export default router;