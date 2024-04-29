import { Router } from "express";
import { loginUser } from "../data/users.js";
import { validatePassword, validateUsername } from "../data/validators.js";

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

export default router;