import { getUserCollection } from "../config/mongoCollections.js";
import {
  validateBoolean,
  validateEmail,
  validateId,
  validateNoNumbers,
  validateNumber,
  validatePassword,
  validateString,
  validateUsername,
} from "./validators.js";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { deepXSS, DUPLICATE_ID_ERROR_CODE, SALT_ROUNDS } from "./util.js";


export const getUserById = async (id, includePassword = false) => {
  id = validateId(id);
  const users = await getUserCollection();
  const user = await users.findOne({ _id: new ObjectId(id) });
  if (!user) throw "Error: User not found";
  if (!includePassword) delete user.password;
  user.displayName = (user.isArtist ? "🖌️" : "") + user.username;
  return user;
};

export const getUserByUsername = async (username, includePassword = false) => {
  username = validateUsername(username);
  const users = await getUserCollection();
  const user = await users.findOne({ username });
  if (!user) throw "Error: User not found";
  if (!includePassword) delete user.password;
  return user;
};

export const addUser = async (username, firstName, lastName, email, phoneNumber, bio, statement, plainTextPassword, isArtist) => {
  username = validateUsername(username);
  firstName = validateNoNumbers(firstName, { length: [2, 16] });
  lastName = validateNoNumbers(lastName, { length: [2, 16] });
  email = validateEmail(email);
  phoneNumber = validateString(phoneNumber);
  bio = validateString(bio, { length: [] });
  statement = validateString(statement, { length: [] });
  plainTextPassword = validatePassword(plainTextPassword);
  isArtist = validateBoolean(isArtist);
  let dateJoined = new Date().getTime();
  let password = await bcrypt.hash(plainTextPassword, SALT_ROUNDS);
  let user = {
    username,
    firstName,
    lastName,
    email,
    phoneNumber,
    bio,
    statement,
    password,
    dateJoined,
    isArtist,
    reviews: [],
    posts: [],
    threads: [],
    likedPosts: [],
    incomingCommissions: [],
    outgoingCommissions: [],
  };
  user = deepXSS(user);
  const users = await getUserCollection();
  // mongoDB will fail if duplicate name
  let newInsertInformation;
  try {
    newInsertInformation = await users.insertOne(user);
  } catch (error) {
    if (error?.code === DUPLICATE_ID_ERROR_CODE && error?.keyPattern?.username) {
      throw "Username already taken!";
    }
    throw error;
  }
  if (!newInsertInformation.insertedId) throw "Posting failed!";
  return newInsertInformation.insertedId.toString();
};

export const loginUser = async (username, password) => {
  username = validateUsername(username);
  password = validatePassword(password);

  const users = await getUserCollection();
  const user = await users.findOne({ username });
  if (user == null) throw new Error("Either the username or password is invalid.");

  // comparing password to database
  let passwordMatch = await bcrypt.compare(password, user.password);
  if (passwordMatch) {
    return user;
  } else {
    throw new Error("Either the username or password is invalid.");
  }
};

export const getThreads = async (userID, { skip = 0, limit = 50 } = {}) => {
  userID = validateId(userID);
  skip = validateNumber(skip, { range: [0] });
  limit = validateNumber(limit, { range: [1, 50] });
  const user = await getUserById(userID);
  // reversed for most recent first
  return user.threads.toReversed().slice(skip, skip + limit);
};

export const getOrAddThread = async (userID, threadName) => {
  threadName = validateString(threadName);
  let user = await getUserById(userID);
  let res = user.threads.find(thread => thread.name === threadName)?._id;
  if (!res) {
    const newThread = { _id: new ObjectId(), name: threadName, posts: [] };
    const users = await getUserCollection();
    let insertion = await users.updateOne({ _id: new ObjectId(userID) }, { $push: { threads: newThread } });
    // console.log("Thread", insertion);
    if (!insertion) {
      throw "Could not add thread";
    }
    return newThread._id.toString();
  }
  return res;
};

export const switchAccountType = async (userId, newAccountType) => {
  userId = validateId(userId);
  console.log(newAccountType);
  if (typeof newAccountType !== "boolean") throw "newAccountType must be a boolean";
  const users = await getUserCollection();
  const update = await users.updateOne({ _id: new ObjectId(userId) }, { $set: { isArtist: newAccountType } });
  if (!update || update.modifiedCount < 1) throw "Could not update account type";
  return update;
};

export const addPostToUserPosts = async (userId, postId) => {
  userId = validateId(userId);
  postId = validateId(postId);
  const users = await getUserCollection();
  const update = await users.updateOne({ _id: new ObjectId(userId) }, { $push: { posts: postId } });
  if (!update || update.modifiedCount < 1) throw "Could not add post to user";
  return update;
};

export const addPostToThread = async (userId, threadId, postId) => {
  userId = validateId(userId);
  postId = validateId(postId);
  threadId = validateId(threadId);
  console.log("Adding", userId, threadId, postId);
  const users = await getUserCollection();
  const update = await users.updateOne(
    { _id: new ObjectId(userId), "threads._id": new ObjectId(threadId) },
    { $push: { "threads.$.posts": postId } },
  );
  if (!update || update.modifiedCount < 1) throw "Could not add post to thread";
  return update;
};

export const addReview = async (reviewee, reviewText, reviewer) => {
  reviewee = validateUsername(reviewee);
  reviewer = validateUsername(reviewer);
  if (reviewee === reviewer) throw new Error("You cannot write a review for yourself!");
  let revieweeUser = await getUserByUsername(reviewee);
  if (!revieweeUser.isArtist) throw new Error("You cannot write a review for a non-artist account!");

  reviewText = validateString(reviewText, { length: [] });
  let datePosted = new Date();
  let dateString = datePosted.toLocaleString();

  let review = {
    reviewer: reviewer,
    reviewText: reviewText,
    reviewDate: dateString
  };
  review = deepXSS(review);

  const users = await getUserCollection();
  const update = await users.updateOne({username: reviewee}, {$push: {reviews: {$each: [review], $position: 0 }}});
  if(!update) throw new Error("Could not add post to user");
  return update;

};