import pages from "./pages.js";
import posts from "./posts.js";

const constructorMethod = (app) => {
  app.use("/", pages);
  app.use("/posts", posts);

  app.use("*", (req, res) => {
    res.status(404).json({ error: "route not found" });
  });
};

export default constructorMethod;