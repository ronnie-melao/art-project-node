import { Router } from "express";
import { postData } from "../data/index.js";
import { errorsToString, tryOrPushErr, validateId, validateString } from "../data/validators.js";
import { convertHEIC, convertPDF, deepXSS, getSearchTerms, imageFilesToLinks } from "../data/util.js";
import { addPost } from "../data/posts.js";
import { getOrAddThread, getThreads } from "../data/users.js";

let router = new Router();


router
  .route("/create")
  .get(async (req, res) => {
    let threads = (await getThreads(req.session?.user?._id)).map(thread => thread.name);
    res.render("posts/create", { title: "Create a Post", user: req.session?.user, nums: [1, 2, 3, 4], threads });
  })
  .post(async (req, res) => {
    let errors = [];
    let { title, description, keywords, thread } = req.body ?? {};
    let poster = req.session?.user?._id;
    poster = tryOrPushErr(errors, { poster }, validateId);
    title = tryOrPushErr(errors, { title }, validateString, { length: [1, 32] });
    description = tryOrPushErr(errors, { description }, validateString, { length: [0] });
    keywords = tryOrPushErr(errors, { keywords }, validateString, { length: [0] });
    thread = tryOrPushErr(errors, { thread }, validateString, { length: [0] });


    // parameters for every error response, in callback so only calculated if needed.
    let p = () => ({ title: "Create a Post", user: req.session?.user, nums: [1, 2, 3, 4] });
    if (errors.length > 0) {
      let error = errorsToString(errors);
      return res.status(400).render("posts/create", { error, ...p() });
    }

    const f = req.files ?? {};
    let files = [f.file1, f.file2, f.file3, f.file4].filter(file => file);
    if (files.length <= 0) {
      return res.status(400).render("posts/create", { error: "No file uploaded", ...p() });
    }
    files = await Promise.all(files.map(convertHEIC));
    files = await Promise.all(files.map(convertPDF));

    let badFiles = files.filter(file => !["image/png", "image/jpeg"].includes(file.mimetype));
    if (badFiles.length > 0) {
      let error = "Bad file type(s), expected (png, jpg, jpeg, heic, pdf): " + badFiles.map(file => file.name).join(", ");
      console.log("Encountered bad filetypes: " + badFiles.map(file => file.mimetype).join(", "));
      return res.status(400).render("posts/create", { error, ...p() });
    }
    try {
      keywords = getSearchTerms(keywords.split(","));
      thread = thread && await getOrAddThread(poster, thread);
      let images = await imageFilesToLinks(files);
      let postID = await addPost(poster, title, images, description, keywords, thread);
      // see new post!
      res.redirect(`/posts/${postID}`);
    } catch (err) {
      console.log(err);
      return res.status(500).render("posts/create", { error: "Internal Server Error", ...p() });
    }
  });

router
  .route("/:id")
  .get(async (req, res) => {
    try {
      req.params.id = validateId(req.params.id, "Id URL Param");
    } catch (e) {
      return res.status(400).render("error", { title: "error", error: e });
    }
    try {
      const post = await postData.getPostById(req.params.id);
      //console.log(post);
      post.hasComments = post.comments.length > 0;
      res.render("posts/single", { title: post?.title ?? "Post", post: [post], user: req.session?.user });
    } catch (e) {
      return res.status(404).render("error", { title: "error", error: e, user: req.session?.user });
    }
  });

//AJAX route for posting comment
router
  .route("/:id/comment")
  .post(async (req, res) => {
    try {
      req.session.user.username;
    } catch (e) {
      return res.status(401).render("error", { title: "error", error: "Unauthorized", user: req.session?.user });
    }
    try {
      req.params.id = validateId(req.params.id, "Id URL Param");
    } catch (e) {
      return res.status(400).render("error", { title: "error", error: e, user: req.session?.user });
    }

    try {
      let postId = req.params.id;
      let cleanComment = deepXSS(req.body.comment);
      let username = req.session.user.username;
      let postComment = await postData.addComment(postId, username, cleanComment);
      res.json({ success: true, newComment: postComment });
    } catch (e) {
      return res.status(400).render("error", { title: "error", error: e, user: req.session?.user });
    }

  });

//AJAX route for posting replies
router
  .route("/:id/comment/:commentId/reply") //I need to make sure I can write it like this
  .post(async (req, res) => {
    try {
      req.session.user.username;
    } catch (e) {
      return res.status(401).render("error", { title: "error", error: "Unauthorized", user: req.session?.user });
    }
    try {
      req.params.id = validateId(req.params.id, "Id URL Param");
      req.params.commentId = validateId(req.params.commentId, "Id Comment URL Param");
    } catch (e) {
      return res.status(400).render("error", { title: "error", error: e });
    }
    try {
      let postId = req.params.id;
      let commentId = req.params.commentId;
      let cleanReply = deepXSS(req.body.reply);
      let username = req.session.user.username;
      let postReply = await postData.addReply(postId, commentId, username, cleanReply);
      res.json({ success: true, newReply: postReply });
    } catch (e) {
      return res.status(400).render("error", { title: "error", error: e, user: req.session?.user });
    }

  });

export default router;