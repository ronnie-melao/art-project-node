import { Router } from "express";
import { postData } from "../data/index.js";
import { validateId } from "../data/validators.js";
import { deepXSS } from "../data/util.js";

let router = new Router();

router
  .route("/:id")
  .get(async (req, res) => {
    try {
      req.params.id = validateId(req.params.id, "Id URL Param");
    } catch (e) {
      return res.status(400).json({ error: e });
    }
    try {
      const post = await postData.getPostById(req.params.id);
      //console.log(post);
      let hasComments = post[0].comments.length > 0;
      post[0].hasComments = hasComments;
      res.render("posts/single", { post: post, user: req.session?.user });
    } catch (e) {
      res.status(404).json({ error: e });
    }
  });

  //AJAX route for posting comment
  router
  .route("/:id/comment")
  .post(async (req, res) => {
    try{
        req.session.user.username;
    }
    catch (e){
        return res.status(401).json({ error: "Unauthorized"});
    }
    try {
        req.params.id = validateId(req.params.id, "Id URL Param");
    } catch (e) {
        return res.status(400).json({ error: e });
    }

    try{
        let postId = req.params.id;
        let cleanComment = deepXSS(req.body.comment);
        let username = req.session.user.username;
        let postComment = await postData.addComment(postId, username, cleanComment);
        res.json({success: true, newComment: postComment});
    }
    catch(e){
        return res.status(400).json({ error: e });
    }
    
  });

  //AJAX route for posting replies
  router
  .route("/:id/comment/:commentId/reply") //I need to make sure I can write it like this
  .post(async (req, res) => {
    try{
        req.session.user.username;
    }
    catch (e){
        return res.status(401).json({ error: "Unauthorized"});
    }
    try {
        req.params.id = validateId(req.params.id, "Id URL Param");
        req.params.commentId = validateId(req.params.commentId, "Id Comment URL Param");
    } catch (e) {
        return res.status(400).json({ error: e });
    }
    try{
        let postId = req.params.id;
        let commentId = req.params.commentId;
        let cleanReply = deepXSS(req.body.reply);
        let username = req.session.user.username;
        let postReply = await postData.addReply(postId, commentId, username, cleanReply);
        res.json({success: true, newReply: postReply});
    }
    catch(e){
        return res.status(400).json({ error: e });
    }

  });

export default router;