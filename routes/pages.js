import { Router } from "express";

let router = new Router();

router.route("/").get(async (req, res) => {
  res.render("home", { title: "Art Site" });
});

export default router;