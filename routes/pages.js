import { Router } from "express";
import { addUser, loginUser } from "../data/users.js";
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
    password
    } = req.body;

  try {

    username = validateUsername(username);
    password = validatePassword(password);

    const user = await loginUser(username, password);
    
    if (!user) throw "User is not in the database!";
    req.session.user = {
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
      outgoingCommissions: user.outgoingCommissions
    };
    res.redirect("/profile");

  } catch (e) {
    if (e.message === "Either the username or password is invalid.") {
      res.status(400).render('login', {
        e: "Please register before logging in."
      });
    } else {
    res.status(400).render('login', {e: 'Invalid username or password. Please try again.'});
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
    isArtist
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
        res.status(200).redirect('/login');
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

router.route("/profile").get(async (req, res) => {
  let page = req.session.user.isArtist ? "artist" : "user";
  res.render(page, { title: "Art Site", user: req.session?.user, isSelf: true });
});

export default router;