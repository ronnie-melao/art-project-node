import pages from "./pages.js";

const constructorMethod = (app) => {
  app.use("/", pages);

  app.use("*", (req, res) => {
    res.status(404).json({ error: "route not found" });
  });
};

export default constructorMethod;