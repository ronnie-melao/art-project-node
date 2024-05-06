import { Router } from "express";
import { postData } from "../data/index.js";
import { errorsToString, tryOrPushErr, validateId, validateString } from "../data/validators.js";
import { convertHEIC, convertPDF, deepXSS, getSearchTerms, imageFilesToLinks } from "../data/util.js";
import { addLike, addPost, getPostsFromThread, removeLike } from "../data/posts.js";
import { checkUserLikedPost, getOrAddThread, getThreads, getUserById } from "../data/users.js";

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
      let isLiked = false;
      let isSelf = false;
      if(req.session?.user){
        console.log(req.session.user._id, req.params.id)
        isLiked = await checkUserLikedPost(req.session.user._id, req.params.id);
        console.log('poster id, ', post.poster._id);
        isSelf = (post.poster._id.toString() === req.session.user._id);
      }
      post.isLiked = isLiked;
      post.isSelf = isSelf;
      post.comments.reverse();
      res.render("posts/single", { title: post?.title ?? "Post", post: [post], user: req.session?.user});
    } catch (e) {
      return res.status(404).render("error", { title: "error", error: e, user: req.session?.user });
    }
  });

  router
  .route("/edit/:id")
  .get(async (req, res) => {
    try {
      req.params.id = validateId(req.params.id, "Id URL Param");
    } catch (e) {
      return res.status(400).render("error", { title: "error", error: e });
    }
    try {
      const post = await postData.getPostById(req.params.id);
      //console.log(post);
      let isSelf = false;
      if(req.session?.user){
        console.log(req.session.user._id, req.params.id)
        isSelf = post.poster._id.toString() === req.session.user._id;
      }
      if(!isSelf) throw 'Not authorized to edit this post';
      post.isSelf = isSelf;
      console.log(post);
      let keywords = "";
      for(let word of post.keywords){
        keywords += word + ", "
      }
      res.render("posts/edit", { title: post?.title ?? "Post", post: post, keywords: keywords, user: req.session?.user});
    } catch (e) {
      return res.status(404).render("error", { title: "error", error: e, user: req.session?.user });
    }
  })
  .post(async (req, res) => {
    console.log('in post edit');
    let errors = [];
    console.log(req.body);
    let  {title, description, keywords} = req.body;
    let postId = req.params.id;
    try {
      postId = validateId(postId, "Post ID URL Param");
    } catch (e) {
      return res.status(400).render("error", { title: "Error", error: e });
    }

    // validate 
      title = tryOrPushErr(errors, {title} , validateString, { length: [1, 32] });
      description = tryOrPushErr(errors, {description} , validateString, { length: [0] });
      keywords = tryOrPushErr(errors,  {keywords} , validateString, { length: [0] });
      title = tryOrPushErr(errors, {title} , deepXSS);
      description = tryOrPushErr(errors, {description} , deepXSS);
      keywords = tryOrPushErr(errors,  {keywords} , deepXSS );
      //images = tryOrPushErr(errors, { images }, validateArray, { validator: validateString });  
  
    // Parameters for error response
    let p = () => ({ title: "Edit Post", post: { title, description}, keywords, user: req.session?.user});
    console.log(errors);
    if (errors.length > 0) {
      console.log('in the errors');
      let error = errorsToString(errors);
      return res.status(400).render("posts/edit", { error, ...p() });
    }
    keywords = getSearchTerms(keywords.split(','));
    // Fetch the post from the database
    let post;
    try {
      post = await postData.getPostById(postId);
    } catch (e) {
      return res.status(404).render("error", { title: "Error", error: e });
    }

    // Check if user is the author
    if (req.session?.user?._id !== post.poster._id.toString()) {
      return res.status(403).render("error", { title: "Unauthorized", error: "You do not have permission to edit this post" });
    }

    // Update the post
    try {
      let updatedPost = await postData.updatePost(postId, req.session.user._id, title, description, keywords);
      res.redirect(`/posts/${updatedPost}`);
    } catch (e) {
      console.error(e);
      return res.status(500).render("posts/edit", { error: "Internal Server Error", ...p() });
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
      let comment = req.body.comment;
      let username = req.session.user.username;
      let postComment = await postData.addComment(postId, username, comment);
      res.json({ success: true, newComment: deepXSS(postComment, true) });
    } catch (e) {
      return res.status(400).render("error", { title: "error", error: e, user: req.session?.user });
    }

  });

//AJAX route for posting replies
router
  .route("/:id/comment/:commentId/reply") 
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
      let reply = req.body.reply;
      let username = req.session.user.username;
      let postReply = await postData.addReply(postId, commentId, username, reply);
      res.json({ success: true, newReply: deepXSS(postReply, true) });
    } catch (e) {
      return res.status(400).render("error", { title: "error", error: e, user: req.session?.user });
    }

  });

//AJAX route for liking a post
router
  .route("/:id/like") 
  .post(async (req, res) => {
    try {
      req.session.user._id;
    } catch (e) {
      return res.status(401).render("error", { title: "error", error: "Unauthorized", user: req.session?.user });
    }
    try {
      req.params.id = validateId(req.params.id, "Id URL Param");
      req.session.user._id = validateId(req.session.user._id, "User ID");
    } catch (e) {
      console.log('failed here');
      return res.status(400).render("error", { title: "error", error: e });
    }
    try{
      let postId = req.params.id;
      let userId = req.session.user._id;
      let likedState = await checkUserLikedPost(userId, postId);
      let updatedPost;
      if(likedState){
        updatedPost = await removeLike(postId, userId);
      }
      else{
        updatedPost = await addLike(postId, userId);
      }
      let newLikedState = !likedState
      res.json({ success: true, post: updatedPost, newLikedState: newLikedState });
    }
    catch(e){
      console.log('no here');
      return res.status(400).render("error", { title: "error", error: e, user: req.session?.user });
    }
  });
router
  .route("/thread/:userId/:threadId")
  .get(async (req, res) => {
    let userId, threadId, thread;
    try {
      userId = validateId(req.params.userId);
      threadId = validateId(req.params.threadId);
      // verify user exists
      let user = await getUserById(userId);
      // verify thread exists
      thread = user.threads.find(thread => thread._id.toString() === threadId);
      if (!thread) throw "Thread not found";
    } catch (e) {
      return res.status(400).render("error", { title: "error", error: e, user: req.session?.user });
    }
    try {
      let posts = await getPostsFromThread(userId, threadId);
      res.render("posts/thread", { title: "Thread", user: req.session?.user, posts, threadName: thread.name });
    } catch (e) {
      console.log(e);
      return res.status(500).render("error", {
        title: "error",
        error: "Internal Server Error",
        user: req.session?.user,
      });
    }
  });

export default router;