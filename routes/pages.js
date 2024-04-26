import { Router } from "express";
import { postData } from "../data/index.js";

let router = new Router();

router.route("/").get(async (req, res) => {
  res.render("home", { title: "Art Site" });
});

router.route("/login").get(async (req, res) => {
  // temporary dummy user for testing
  res.render("home", { title: "Art Site", user: {} });
});

router.route("/search").post(async (req, res) => {
  let query = req.body?.query;
  let results = await postData.getPostsFromSearch(query);
  res.render("search", { title: "Search Results", results, query });
});

export default router;