import { Router } from "express";
import { addReview, addUser, getUserByUsername, loginUser, switchAccountType, checkReviewer } from "../data/users.js";
import {
  validateBoolean,
  validateEmail,
  validateNoNumbers,
  validatePassword,
  validatePhoneNumber,
  validateString,
  validateUsername,
} from "../data/validators.js";
import { getMostRecentPosts, getPostById, getTopLikedPosts, getLikedPosts } from "../data/posts.js";
import { postData } from "../data/index.js";
import { addCommission, getArtistCommissions } from "../data/commissions.js";
import { getUserCollection } from "../config/mongoCollections.js";

let router = new Router();

router.route("/").get(async (req, res) => {
  try {
    const topLikedPosts = await getTopLikedPosts();
    const mostRecentPosts = await getMostRecentPosts();

    res.render("home", { title: "Art Site", user: req.session?.user, topLikedPosts, mostRecentPosts });
  } catch (e) {
    // Handle errors appropriately
    console.error(e);
    res.status(500).send("Internal Server Error");
  }

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
    req.session.user = { ...user };
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
    phoneNumber = validatePhoneNumber(phoneNumber);
    bio = validateString(bio, { length: [0, 1024] });
    statement = validateString(statement, { length: [0, 100] });
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

router.route("/review/:username").get(async (req, res) => {
  let profile;

  try {
    profile = await getUserByUsername(req.params.username);
  } catch (e) {
    return res.status(401).render("error", { title: "error", error: "No user found", user: req.session?.user });
  }

  try {
    req.session.user.username;
  } catch (e) {
    return res.status(401).render("error", { title: "error", error: "Unauthorized", user: req.session?.user });
  }
  
  try {
    let doubleReview = await checkReviewer(req.params.username, req.session.user.username);
    if (doubleReview) throw new Error ("You cannot write a second review for an account!");
  
    res.render("review", { title: "Create Review", profile: profile });
  }  catch (e) {
    return res.status(401).render("error", { title: "error", error: e , user: req.session?.user });
  }
});

router.route("/review/:username").post(async (req, res) => {
  let profile;
  
  try {
    profile = await getUserByUsername(req.params.username);
    let { reviewText } = req.body;
  } catch (e) {
    return res.status(401).render("error", { title: "error", error: e , user: req.session?.user });
  }

  try {
    req.session.user.username;
  } catch (e) {
    return res.status(401).render("error", { title: "error", error: "Unauthorized", user: req.session?.user });
  }

  try {
    let isSelf = req.session?.user?.username === req.params.username;
    if (isSelf)
      throw new Error("You cannot write a review for yourself!");

    let profile = await getUserByUsername(req.params.username);
    let isArtist = profile.isArtist;
    if (!isArtist)
      throw new Error("You cannot write a review for a non-artist account!");

    reviewText = validateString(reviewText, { length: [1, 1024] });

    const review = await addReview(req.params.username, reviewText, req.session.user.username);

    if (review)
      res.status(200).redirect(`/profile/${req.params.username}`);
    else
      throw "The review could not be added!";

  } catch (e) {
    res.status(400).render("review", {profile: profile, e });
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
  try {
    let profile = await getUserByUsername(req.params.username);
    let isArtist = profile.isArtist;
    let oppositeAccountType = profile.isArtist ? "user" : "artist";
    let isSelf = req.session?.user?.username === req.params.username;
    let posts = [];
    for (let postId of profile.posts) {
      posts.push(await getPostById(postId));
    }
    res.render("profile", {
      title: "Art Site",
      profile: profile,
      isSelf: isSelf,
      isArtist: isArtist,
      oppositeAccountType: oppositeAccountType,
      user: req.session?.user,
      posts: posts.toReversed(),
    });
  } catch (e) {
    res.status(404).render("error", { error: e });
  }
});

router.route("/switchProfile").post(async (req, res) => {
  try {
    const userId = req.session.user._id;
    let newIsArtist = req.body.newIsArtist;
    let profile = await switchAccountType(userId, newIsArtist);
    res.json({ success: true, profile: profile });
  } catch (e) {
    console.log(e);
  }
});
router.route("/commissions").get(async (req, res) => {
  try {
    let current_username = req.session.user.username;
    let commissionsArray = await getArtistCommissions(current_username);
    res.render("commissions", {
      title: "Art Site",
      user: req.session?.user,
      script_partial: "commissions_script",
      commissionsArray: JSON.stringify(commissionsArray)
    });
  } catch (e) {
    res.status(500).render("commissions", {e: "Internal Server Error"});
  }
});

router.route("/commission_request").get(async (req, res) => {
  res.render("commission_request", { title: "Art Site", user: req.session?.user });
});

router.route("/commission_request").post(async (req, res) => {
  let requesterUsername = req.session.user?.username;
  let {
    artistUsername,
    description,
    price,
  } = req.body;

  try {
    if (!artistUsername) throw "No artist!";
    if (!description) throw "No description!";
    if (!price) throw "No price!";
    artistUsername = artistUsername.trim();
    description = description.trim();
    price = price.trim();
    price = parseFloat(price);

    description = validateString(description);
    if (isNaN(price)) throw "Price must be a number!";
    
    const users = await getUserCollection();
    const existingArtist = await users.findOne({username: artistUsername});
    if (!existingArtist) throw "This artist does not exist!";

  } catch (e) {
    res.status(400).render("commission_request", { e: e, user: req.session?.user });
  }
  try {
    await addCommission(artistUsername, requesterUsername, description, price);
  } catch (e) {
    console.log(e);
    res.status(500).render("commission_request", { e: "Internal Server Error", user: req.session?.user });
  }
});

router.route("/liked").get(async (req, res) => {
  try {
    if (!req.session.user) throw new Error("Not logged in, can't access likes.");
    const userId = req.session.user._id;
    let likedPosts = await getLikedPosts(userId);
    if (likedPosts) {
      res.render("likedposts", {
        title: "Liked Posts",
        user: req.session?.user,
        likedPosts: likedPosts
      });
    }
    else {
      res.render("likedposts", {
        title: "Liked Posts",
        user: req.session?.user
      });
    }
  } catch (e) {
    res.status(400).render("likedposts", { e });
  }
});

router.route("/settings").get(async (req, res) => {
  res.render("settings", { title: "Settings", user: req.session?.user });
});

export default router;