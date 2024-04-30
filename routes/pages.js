import { Router } from "express";
import { loginUser, addUser } from "../data/users.js";
import { validatePassword, validateUsername, validateBoolean, validateEmail, validateNoNumbers,validateString } from "../data/validators.js";
import { postData } from "../data/index.js";

let router = new Router();

router.route("/").get(async (req, res) => {
  res.render("home", { title: "Art Site" });
});

router.route("/login").get(async (req, res) => {
  res.render("login", { title: "Art Site", user: {} });
});

router.route("/login").post(async (req, res) => {
  
  let {
    username,
    password
    } = req.body;

  try {

    validateUsername(username);
    validatePassword(password);

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

  res.cookie('AuthenticationState', true);

  if (user.isArtist) {
    res.redirect('/artist');
  } else {
      res.redirect('/user');
    }

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
  res.render("register", { title: "Art Site", user: {} });
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
    if (isArtist === 'true')
      isArtist = true;
    else
      isArtist = false;

    validateUsername(username);
    validateNoNumbers(firstName, { length: [2, 16] });
    validateNoNumbers(lastName, { length: [2, 16] });
    validateEmail(email);
    validateString(phoneNumber);
    validateString(bio, { length: [] });
    validateString(statement, { length: [] });
    validatePassword(password);
    validateBoolean(isArtist);

    const user = await addUser(username, firstName, lastName, email, phoneNumber, bio, statement, password, isArtist);
    
    if (user)
        res.status(200).redirect('/login');
    else
      throw "That username is already taken! Please try another one.";

  } catch (e) {
      res.status(400).render('register', { e: e });
    }
});

router.route("/search").post(async (req, res) => {
  let query = req.body?.query;
  let results = await postData.getPostsFromSearch(query);
  res.render("search", { title: "Search Results", results, query });
});

router.route("/user").get(async (req, res) => {
  res.render("user", { title: "Art Site", user: {} });
});

router.route("/artist").get(async (req, res) => {
  res.render("artist", { title: "Art Site", user: {} });
});

export default router;