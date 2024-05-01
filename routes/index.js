import pages from "./pages.js";
import posts from "./posts.js";

const constructorMethod = (app) => {
  app.use("/", pages);
  app.use("/posts", posts);

  app.use("*", (req, res) => {
    res.status(404).render("error", { error: "404: route not found", user: req.session?.user });
  });
};

export default constructorMethod;