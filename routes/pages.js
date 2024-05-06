import { Router } from "express";
import { addUser, getUserByUsername, loginUser, switchAccountType } from "../data/users.js";
import {
  validateBoolean,
  validateEmail,
  validateNoNumbers,
  validatePassword,
  validateString,
  validateUsername,
} from "../data/validators.js";
import { postData } from "../data/index.js";

let router = new Router();

router.route("/").get(async (req, res) => {
  res.render("home", { title: "Art Site", user: req.session?.user });
});

router.route("/login").get(async (req, res) => {
  res.render("login", { title: "Art Site", layout: "login" });
});

router.route("/login").post(async (req, res) => {

  let {
    username,
    password,
  } = req.body;

  try {

    username = validateUsername(username);
    password = validatePassword(password);

    const user = await loginUser(username, password);

    if (!user) throw "User is not in the database!";
    req.session.user = {
      _id: user._id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      bio: user.bio,
      statement: user.statement,
      password: user.password,
      dateJoined: user.dateJoined,
      isArtist: user.isArtist,
      reviews: user.reviews,
      posts: user.posts,
      threads: user.threads,
      likedPosts: user.likedPosts,
      incomingCommissions: user.incomingCommissions,
      outgoingCommissions: user.outgoingCommissions,
    };
    res.redirect("/profile/" + user.username);

  } catch (e) {
    if (e.message === "Either the username or password is invalid.") {
      res.status(400).render("login", {
        e: "Please register before logging in.",
      });
    } else {
      res.status(400).render("login", { e: "Invalid username or password. Please try again." });
    }
  }

});

router.route("/register").get(async (req, res) => {
  res.render("register", { title: "Art Site", layout: "login" });
});

router.route("/register").post(async (req, res) => {

  let {
    firstName,
    lastName,
    username,
    password,
    email,
    phoneNumber,
    bio,
    statement,
    isArtist,
  } = req.body;

  try {

    // converts isArtist to boolean
    isArtist = isArtist === "true";

    username = validateUsername(username);
    firstName = validateNoNumbers(firstName, { length: [2, 16] });
    lastName = validateNoNumbers(lastName, { length: [2, 16] });
    email = validateEmail(email);
    phoneNumber = validateString(phoneNumber);
    bio = validateString(bio, { length: [] });
    statement = validateString(statement, { length: [] });
    password = validatePassword(password);
    isArtist = validateBoolean(isArtist);

    const user = await addUser(username, firstName, lastName, email, phoneNumber, bio, statement, password, isArtist);

    if (user)
      res.status(200).redirect("/login");
    else
      throw "That username is already taken! Please try another one.";

  } catch (e) {
    res.status(400).render("register", { e });
  }
});

router.route("/logout").get(async (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

router.route("/search").post(async (req, res) => {
  let query = req.body?.query;
  let results = await postData.getPostsFromSearch(query);
  res.render("search", { title: "Search Results", results, query, user: req.session?.user });
});

router.route("/profile/:username").get(async (req, res) => {
  let profile = await getUserByUsername(req.params.username);
  let isArtist = profile.isArtist;
  let oppositeAccountType = profile.isArtist ? "user" : "artist";
  let isSelf = req.session?.user?.username === req.params.username;
  res.render('profile', { title: "Art Site", profile: profile, isSelf: isSelf, isArtist: isArtist, oppositeAccountType: oppositeAccountType, user: req.session?.user });
});

router.route("/switchProfile").post(async (req, res) => {
  try{
    const userId = req.session.user._id;
    let newIsArtist = req.body.newIsArtist;
    let profile = await switchAccountType(userId, newIsArtist);
    res.json({ success: true, profile: profile });
  }
  catch(e){
    console.log(e); 
  }
});
export default router;