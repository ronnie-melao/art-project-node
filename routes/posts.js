import { Router } from "express";
import { postData } from "../data/index.js";
import { validateId } from "../data/validators.js";

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


export default router;