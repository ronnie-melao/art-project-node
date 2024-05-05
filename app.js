import express from "express";
import configRoutes from "./routes/index.js";
import exphbs from "express-handlebars";
import session from "express-session";
import middleware from "./middleware.js";
import fileUpload from "express-fileupload";

const app = express();


app.use("/public", express.static("public"));
app.use(fileUpload(undefined));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    name: "AuthenticationState",
    secret: "Between me and you buddy, this is the secret.",
    saveUninitialized: false,
    resave: false,
  }),
);
app.use(middleware);

app.engine("handlebars", exphbs.engine({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

configRoutes(app);

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000!");
});