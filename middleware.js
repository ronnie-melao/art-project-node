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
router.route("/login").get(nonUsersOnlyMDWare);
router.route("/register").get(nonUsersOnlyMDWare);
const userOnlyMDWare = async (req, res, next) => {

  if (req.session?.user) {
    next();
  } else {
    res.redirect("/login");
  }
};
router.route("/logout").get(userOnlyMDWare);
router.route("/profile").get(userOnlyMDWare);

export default router;