import { tryOrPushErr, validateArray, validateId, validateString, validateUsername } from "./validators.js";
import { getPostCollection } from "../config/mongoCollections.js";
import { deepXSS, getSearchTerms, relativeTime } from "./util.js";
import { getUserById } from "./users.js";
import { ObjectId } from "mongodb";

/**
 * Makes a post given the parameters within an object
 * Errors are thrown in an array, that array lists all the errors.
 */
export const addPost = async (poster, title, images, description, keywords, thread = "") => {
  let errors = [];
  poster = tryOrPushErr(errors, { poster }, validateId);
  title = tryOrPushErr(errors, { title }, validateString, { length: [1, 32] });
  images = tryOrPushErr(errors, { images }, validateArray, { validator: validateString });
  description = tryOrPushErr(errors, { description }, validateString, { length: [0] });
  keywords = tryOrPushErr(errors, { keywords }, validateArray, { length: [0], validator: validateString });
  thread = tryOrPushErr(errors, { thread }, validateString, { length: [0] });
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
    thread,
    timePosted,
    searchTerms,
    likes: [],
    comments: [],
    isEdited: false,
  };
  post = deepXSS(post);
  const newInsertInformation = await posts.insertOne(post);
  if (!newInsertInformation.insertedId) throw "Posting failed!";
  return newInsertInformation.insertedId;
};

const addPosterToPosts = async (posts) => {
  // use set so only one request per user.
  let users = new Set();
  for (const post of posts) {
    post.formattedTimePosted = relativeTime(post.timePosted);
    users.add(post.poster);
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
  let queryTerms = getSearchTerms(query);
  let posts = await getPostCollection();
  let results = await posts.find({
    searchTerms: { $all: queryTerms },
  }).toArray();
  return addPosterToPosts(results);
};

export const getPostById = async (id) => {
  id = validateId(id);
  let posts = await getPostCollection();
  let post = []
  post.push(await posts.findOne({_id: new ObjectId(id)}));
  if (!post) throw 'Error: Post not found';
  return addPosterToPosts(post);
}; 

//Add comment to a post via the post ID
export const addComment = async (postId, username, content) => {
  postId = validateId(postId);
  username = validateUsername(username);
  content = validateString(content);

  let comment = {
    username : username,
    comment: content,
    replies: []
  }

  comment = deepXSS(comment);
  comment._id = new ObjectId();
  let posts = await getPostCollection();

  //check post exists
  const post = await posts.findOne(
    {_id: new ObjectId(postId)}
  )
  if (!post) {
    throw 'Could not update product successfully';
  }

  let updatedPost = await posts.updateOne(
    {_id: new ObjectId(postId)}, 
    {$push: {comments: comment}}
  )
  if (!updatedPost) throw 'Error: Update failed';
  comment._id = comment._id.toString();
  console.log(updatedPost);
  return comment._id;
}