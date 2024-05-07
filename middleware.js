import c from "ansi-colors";
import { Router } from "express";
import { prettyHttpMethod } from "./data/util.js";

const router = Router();

// Log all requests
router.route("*").all(async (req, res, next) => {
  const prettyTimestamp = c.magentaBright(new Date().toUTCString());
  const prettyMethod = prettyHttpMethod(req.method);
  const prettyLoggedIn = req.session?.user ? c.cyanBright("user") : c.blueBright("anon");
  const prettyUrl = c.yellowBright(req.originalUrl);
  console.log(`[${prettyTimestamp}]: {${prettyLoggedIn}} (${prettyMethod}) ${prettyUrl}`);
  if (req.method === "POST") {
    // don't log password
    let { ...body } = req.body;
    if (body.password) body.password = "****";
    console.log("req.body:", body);
  }
  next();
});

router.route("*").all((req, res, next) => {
  // If the user posts to the server with a property called _method, rewrite the request's method
  // To be that method; so if they post _method=PUT you can now allow browsers to POST to a route that gets
  // rewritten in this middleware to a PUT route
  if (req?.body._method) {
    req.method = req.body._method;
    delete req.body._method;
  }
  next();
});

const nonUsersOnlyMDWare = async (req, res, next) => {
  if (req.session?.user) {
    res.redirect("/");
  } else {
    next();
  }
};
router.route("/login").all(nonUsersOnlyMDWare);
router.route("/register").all(nonUsersOnlyMDWare);
const userOnlyMDWare = async (req, res, next) => {
  if (req.session?.user) {
    next();
  } else {
    res.redirect("/login");
  }
};

router.route("/logout").get(userOnlyMDWare);
router.route("/profile").get(userOnlyMDWare);
router.route("/switchProfile").all(userOnlyMDWare);
router.route("/liked").all(userOnlyMDWare);
router.route("/settings").all(userOnlyMDWare);
router.route("/commissions").all(userOnlyMDWare);
router.route("/commission_request").all(userOnlyMDWare);
router.route("/review/:id").all(userOnlyMDWare);

const artistOnlyMDWare = async (req, res, next) => {
  if (!req.session?.user) {
    res.redirect("/login");
  } else if (!req.session.user.isArtist) {
    res.status(403).render("error", { error: "You must be an artist to access this page!", user: req.session?.user });
  } else {
    next();
  }
};

router.route("/posts/create").all(artistOnlyMDWare);
router.route("/posts/edit").all(artistOnlyMDWare);
router.route("/posts/delete").all(artistOnlyMDWare);
router.route("/commissions/change-status").all(artistOnlyMDWare);

export default router;