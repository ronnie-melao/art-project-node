import { tryOrPushErr, validateArray, validateId, validateString, validateUsername } from "./validators.js";
import { getPostCollection } from "../config/mongoCollections.js";
import { deepXSS, getSearchTerms, relativeTime } from "./util.js";
import { addPostToThread, addPostToUserPosts, getUserById, addPostToUserLikedPosts, removePostFromUserLikedPosts, removePostFromUserPosts, removePostFromUserThreads} from "./users.js";
import { ObjectId } from "mongodb";

/**
 * Makes a post given the parameters within an object
 * Errors are thrown in an array, that array lists all the errors.
 */
export const addPost = async (poster, title, images, description, keywords, threadID = "") => {
  let errors = [];
  poster = tryOrPushErr(errors, { poster }, validateId);
  title = tryOrPushErr(errors, { title }, validateString, { length: [1, 32] });
  images = tryOrPushErr(errors, { images }, validateArray, { validator: validateString });
  description = tryOrPushErr(errors, { description }, validateString, { length: [0] });
  keywords = tryOrPushErr(errors, { keywords }, validateArray, { length: [0], validator: validateString });
  threadID = tryOrPushErr(errors, { threadID }, validateString, { length: [0] });
  if (threadID) validateId(threadID);
  if (errors.length > 0) {
    throw errors;
  }
  let timePosted = new Date().getTime();
  let searchTerms = getSearchTerms(title, description, keywords);
  // throws if poster is not a user
  await getUserById(poster);
  const posts = await getPostCollection();
  let post = {
    poster,
    title,
    images,
    description,
    keywords,
    thread: threadID,
    timePosted,
    searchTerms,
    likes: [],
    comments: [],
    isEdited: false,
  };
  post = deepXSS(post);
  const newInsertInformation = await posts.insertOne(post);
  if (!newInsertInformation.insertedId) throw "Posting failed!";
  await addPostToUserPosts(poster, newInsertInformation.insertedId.toString());
  if (threadID) {
    await addPostToThread(poster, threadID, newInsertInformation.insertedId.toString());
  }
  return newInsertInformation.insertedId;
};

const addPosterToPosts = async (posts) => {
  // use set so only one request per user.
  let users = new Set();
  for (const post of posts) {
    post.formattedTimePosted = relativeTime(post.timePosted);
    users.add(post.poster.toString());
  }
  users = Array.from(users);
  users = await Promise.all(users.map(getUserById));
  let userMap = {};
  for (const user of users) {
    user.displayName = (user.isArtist ? "🖌️" : "") + user.username;
    userMap[user._id] = user;
  }
  posts.forEach(post => post.poster = userMap[post.poster]);
  return posts;
};

export const getPostsFromSearch = async (query) => {
  query = validateString(query, { length: [1, 32] });
  let posts = await getPostCollection();
  let results = await posts.find(
    { $text: { $search: query } },
    { sort: { timePosted: -1 } },
  ).toArray();
  return await addPosterToPosts(results);
};

export const getPostById = async (id) => {
  id = validateId(id);
  let posts = await getPostCollection();
  let post = await posts.findOne({ _id: new ObjectId(id) });
  if (!post) throw "Error: Post not found";
  return (await addPosterToPosts([post]))[0];
};

export const getTopLikedPosts = async () => {
  let posts = await getPostCollection();
  let results = await posts.find(
    {},
    { sort: { likes: -1, timePosted: -1 } },
  ).toArray();
  return await addPosterToPosts(results);
};

export const getMostRecentPosts = async () => {
  let posts = await getPostCollection();
  let results = await posts.find(
    {},
    { sort: { timePosted: -1 } },
  ).toArray();
  return await addPosterToPosts(results);
};

export const getLikedPosts = async (userId) => {
  if (!userId) throw new Error("Not logged in, can't access likes.");
  userId = validateId(userId);
  let user = await getUserById(userId);
  let likeIds = user.likedPosts;
  let likedPostList = [];
  for (let i = likeIds.length - 1; i >= 0; i--){
    likedPostList.push(await getPostById(likeIds[i]));
  }
  return likedPostList;
};

//Add comment to a post via the post ID
export const addComment = async (postId, username, content) => {
  postId = validateId(postId);
  username = validateUsername(username);
  content = validateString(content);

  let comment = {
    username: username,
    comment: content,
    replies: [],
  };

  comment = deepXSS(comment);
  comment._id = new ObjectId();
  let posts = await getPostCollection();

  //check post exists
  const post = await posts.findOne(
    { _id: new ObjectId(postId) },
  );
  if (!post) {
    throw "Could not update product successfully";
  }

  let updatedPost = await posts.updateOne(
    { _id: new ObjectId(postId) },
    { $push: { comments: comment } },
  );
  if (!updatedPost) throw "Error: Update failed";
  comment._id = comment._id.toString();
  return comment;
};

//Add reply to a comment via the post ID and commentID
export const addReply = async (postId, commentId, username, content) => {
  postId = validateId(postId);
  commentId = validateId(commentId);
  username = validateUsername(username);
  content = validateString(content);

  let reply = {
    username: username,
    comment: content,
  };

  reply = deepXSS(reply);
  reply._id = new ObjectId();
  let posts = await getPostCollection();

  //check post exists
  const post = await posts.findOne(
    { _id: new ObjectId(postId) },
  );
  if (!post) {
    throw "Could not update product successfully";
  }
  //check comment exists
  //console.log(post);
  const comment = await posts.findOne(
    { _id: new ObjectId(postId), "comments._id": new ObjectId(commentId) },
  );
  if (!comment) throw "Could not post reply";

  let updatedPost = await posts.updateOne(
    { _id: new ObjectId(postId), "comments._id": new ObjectId(commentId) },
    { $push: { "comments.$.replies": reply } },
  );

  if (!updatedPost) throw "Error: Reply post failed";
  reply._id = reply._id.toString();
  return reply;
};

export const addLike = async (postId, userId) => {
  postId = validateId(postId);
  userId = validateId(userId);

  const posts = await getPostCollection();
  let post = await posts.findOne({ _id: new ObjectId(postId) });
  if (!post) throw "Error: Post not found";

  //will throw if user doesnt exist
  await getUserById(userId);
  let updatedPost = await posts.updateOne({ _id: new ObjectId(postId) }, {$push: {likes: userId}});
  if(!updatedPost) throw 'Could not add like';
  let updatedUser = await addPostToUserLikedPosts(userId, postId);
  console.log(updatedPost);
  return await getPostById(postId);
};

export const removeLike = async (postId, userId) => {
  postId = validateId(postId);
  userId = validateId(userId);

  const posts = await getPostCollection();
  let post = await posts.findOne({ _id: new ObjectId(postId) });
  if (!post) throw "Error: Post not found";

  //will throw if user doesnt exist
  await getUserById(userId);
  let updatedPost = await posts.updateOne({ _id: new ObjectId(postId) }, {$pull: {likes: userId}});
  if(!updatedPost) throw 'Could not remove like';
  let updatedUser = await removePostFromUserLikedPosts(userId, postId);
  console.log(updatedPost);
  return await getPostById(postId);
};

export const getPostsFromThread = async (userID, threadID) => {
  let user = await getUserById(userID);
  let thread = user.threads.find(thread => thread._id.toString() === threadID);
  if (!thread) throw "Could not find thread";
  return await Promise.all(thread.posts.toReversed().map(getPostById));
};

export const updatePost = async (postId, userId, title, description, keywords) => {
  let errors = [];
  postId = tryOrPushErr(errors, { postId }, validateId);
  userId = tryOrPushErr(errors, { userId }, validateId);
  title = tryOrPushErr(errors, { title }, validateString, { length: [1, 32] });
  description = tryOrPushErr(errors, { description }, validateString, { length: [0] });
  keywords = tryOrPushErr(errors, { keywords }, validateArray, { length: [0], validator: validateString });
  if (errors.length > 0) {
    throw errors;
  }
  let searchTerms = getSearchTerms(title, description, keywords);
  // throws if poster is not a user
  await getUserById(userId);
  const posts = await getPostCollection();
  let updatePost = {
    title,
    description,
    keywords,
    searchTerms,
    isEdited: true,
  };
  updatePost = deepXSS(updatePost);
  //throws if post doesnt exist
  let post = await getPostById(postId);

  if(post.poster._id.toString() !== userId) throw 'Not authorized to update this post';

  let updatedInformation = posts.updateOne(
      { _id: new ObjectId(postId) }, 
      {$set: {title: title, description: description, keywords: keywords, searchTerms: searchTerms, isEdited: true}}
      );
  if (!updatedInformation) throw "Updating failed!";
  return postId;
};

export const deletePost = async (postId, userId) =>{
  let errors = [];
  postId = tryOrPushErr(errors, { postId }, validateId);
  userId = tryOrPushErr(errors, { userId }, validateId);
  if (errors.length > 0) {
    throw errors;
  }
  
  // throws if poster is not a user
  await getUserById(userId);
  const posts = await getPostCollection();
  //throws if post doesnt exist
  let post = await getPostById(postId);
  if(post.poster._id.toString() !== userId) throw 'Not authorized to update this post';

  //remove postID from user's posts
  const user = await getUserById(userId); //throws if user doesnt exist
  await removePostFromUserPosts(userId, postId);

  //remove postID from all users' liked posts
  for (const likedUserId of post.likes) {
      await removePostFromUserLikedPosts(likedUserId, postId);
  }
  

  //remove postID from related threads
  await removePostFromUserThreads(userId, postId, post.thread);

  //remove images from storage


  //remove post from database
  const deleteResult = await posts.deleteOne({ _id: new ObjectId(postId) });
  if (!deleteResult || deleteResult.deletedCount < 1) throw "Deleting post failed";

}