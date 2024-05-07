import { Router } from "express";
import {
  addReview,
  addUser,
  checkReviewer,
  deleteReviewFunction,
  getUserByUsername,
  loginUser,
  switchAccountType,
} from "../data/users.js";
import {
  validateBoolean,
  validateEmail,
  validateNoNumbers,
  validatePassword,
  validatePhoneNumber,
  validateString,
  validateUsername,
} from "../data/validators.js";
import { getLikedPosts, getMostRecentPosts, getPostById, getTopLikedPosts } from "../data/posts.js";
import { postData } from "../data/index.js";
import { addCommission, getArtistCommissions, getRequestedCommissions } from "../data/commissions.js";
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
  res.render("login", { title: "Art Site", layout: "login", user: req.session?.user });
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
        user: req.session?.user,
      });
    } else {
      res.status(400).render("login", {
        e: "Invalid username or password. Please try again.",
        user: req.session?.user,
      });
    }
  }

});

router.route("/register").get(async (req, res) => {
  res.render("register", { title: "Art Site", layout: "login", user: req.session?.user });
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
    isArtist = isArtist === "on";

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
    res.status(400).render("register", { e, user: req.session?.user });
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
    let reviewed = await checkReviewer(req.params.username, req.session?.user?.username);
    res.render("review", { title: "Create Review", profile: profile, reviewed: reviewed, user: req.session?.user });
  } catch (e) {
    return res.status(401).render("error", { title: "error", error: e, user: req.session?.user });
  }
});

router.route("/review/:username").post(async (req, res) => {
  let profile;
  let { reviewText, deleteReview } = req.body;
  let reviewed = false;

  try {
    profile = await getUserByUsername(req.params.username);
  } catch (e) {
    return res.status(401).render("error", { title: "error", error: e, user: req.session?.user });
  }

  try {
    req.session.user.username;
  } catch (e) {
    return res.status(401).render("error", { title: "error", error: "Unauthorized", user: req.session?.user });
  }

  try {
    // converts deleteReview to boolean
    deleteReview = deleteReview === "on";
    deleteReview = validateBoolean(deleteReview);

    reviewed = await checkReviewer(req.params.username, req.session?.user?.username);
    let isSelf = req.session?.user?.username === req.params.username;
    if (isSelf)
      throw new Error("You cannot write a review for yourself!");

    let profile = await getUserByUsername(req.params.username);
    let isArtist = profile.isArtist;
    if (!isArtist)
      throw new Error("You cannot write a review for a non-artist account!");

    if (deleteReview) {
      const review = await deleteReviewFunction(req.params.username, req.session.user.username);

      if (review)
        res.status(200).redirect(`/profile/${req.params.username}`);
      else
        throw "The review could not be deleted!";
    } else {
      reviewText = validateString(reviewText, { length: [1, 1024] });

      const review = await addReview(req.params.username, reviewText, req.session.user.username);

      if (review)
        res.status(200).redirect(`/profile/${req.params.username}`);
      else
        throw "The review could not be added!";
    }

  } catch (e) {
    res.status(400).render("review", {
      title: "Create Review",
      profile: profile,
      reviewed: reviewed,
      e,
      user: req.session?.user,
    });
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
    let reviewed = await checkReviewer(req.params.username, req.session?.user?.username);
    let posts = [];
    for (let postId of profile.posts) {
      posts.push(await getPostById(postId));
    }
    res.render("profile", {
      title: "Art Site",
      profile: profile,
      isSelf: isSelf,
      isArtist: isArtist,
      reviewed: reviewed,
      oppositeAccountType: oppositeAccountType,
      user: req.session?.user,
      posts: posts.toReversed(),
    });
  } catch (e) {
    res.status(404).render("error", { error: e, user: req.session?.user });
  }
});

router.route("/switchProfile").post(async (req, res) => {
  try {
    const userId = req.session.user._id;
    let newIsArtist = req.body.newIsArtist;
    let profile = await switchAccountType(userId, newIsArtist);
    req.session.user.isArtist = newIsArtist;
    res.json({ success: true, profile: profile });
  } catch (e) {
    console.log(e);
    res.status(401);
  }
});
router.route("/commissions").get(async (req, res) => {
  try {
    let commissionsArray;
    let current_username = req.session.user.username;
    if (req.session.user.isArtist === true) {
      commissionsArray = await getArtistCommissions(current_username);
    } else {
      commissionsArray = false;
    }
    let outgoingCommissionsArray = await getRequestedCommissions(current_username);
    res.render("commissions", {
      title: "Art Site",
      user: req.session?.user,
      script_partial: "commissions_script",
      commissionsArray: JSON.stringify(commissionsArray),
      outgoingCommissionsArray: JSON.stringify(outgoingCommissionsArray)
    });
  } catch (e) {
    console.log(e);
    res.status(500).render("commissions", { e: "Internal Server Error", user: req.session?.user });
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
    if (!requesterUsername) throw "You are not signed in!";
    artistUsername = artistUsername.trim();
    description = description.trim();
    price = price.trim();
    price = parseFloat(price);

    description = validateString(description);
    if (isNaN(price)) throw "Price must be a number!";

    if (artistUsername === requesterUsername) throw "You cannot request commissions to yourself!";

    const users = await getUserCollection();
    const existingArtist = await users.findOne({ username: artistUsername });
    if (!existingArtist || !existingArtist.isArtist) throw "This artist does not exist!";

  } catch (e) {
    return res.status(400).render("commission_request", {
      e: e,
      user: req.session?.user
    });
  }
  try {
    await addCommission(artistUsername, requesterUsername, description, price);
  } catch (e) {
    console.log(e);
    return res.status(500).render("commission_request", { e: "Internal Server Error", user: req.session?.user });
  }
  res.redirect("/commissions");
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
        likedPosts: likedPosts,
      });
    } else {
      res.render("likedposts", {
        title: "Liked Posts",
        user: req.session?.user,
      });
    }
  } catch (e) {
    res.status(400).render("likedposts", { e, user: req.session?.user });
  }
});

export default router;