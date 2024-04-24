import { getUserCollection } from "../config/mongoCollections.js";
import {
  validateBoolean,
  validateEmail,
  validateId,
  validateNoNumbers,
  validatePassword,
  validateString,
  validateUsername,
} from "./validators.js";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";


export const getUserById = async (id) => {
  id = validateId(id);
  const users = await getUserCollection();
  const user = await users.findOne({ _id: new ObjectId(id) });
  if (!user) throw "Error: User not found";
  return user;
};

export const getUserByUsername = async (username) => {
  username = validateUsername(username);
  const users = await getUserCollection();
  const user = await users.findOne({ username });
  if (!user) throw "Error: User not found";
  return user;
};

export const addUser = async (username, firstName, lastName, email, phoneNumber, bio, statement, plainTextPassword, isArtist) => {
  username = validateUsername(username);
  firstName = validateNoNumbers(firstName);
  lastName = validateNoNumbers(lastName);
  email = validateEmail(email);
  phoneNumber = validateString(phoneNumber);
  bio = validateString(bio, { length: [0] });
  statement = validateString(statement, { length: [0] });
  plainTextPassword = validatePassword(plainTextPassword);
  isArtist = validateBoolean(isArtist);
  let dateJoined = new Date().getTime();
  let password = bcrypt.hash(plainTextPassword, 12);
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
  const users = await getUserCollection();
  const newInsertInformation = await users.insertOne(user);
  if (!newInsertInformation.insertedId) throw "Posting failed!";
  return newInsertInformation.insertedId.toString();
};