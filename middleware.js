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

export default router;