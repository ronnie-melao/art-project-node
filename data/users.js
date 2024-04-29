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
import { deepXSS, DUPLICATE_ID_ERROR_CODE, SALT_ROUNDS } from "./util.js";


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
  const user = await users.findOne({username});
  if (user === null) throw new Error("Either the username or password is invalid.");

  // comparing password to database
  let passwordMatch = await bcrypt.compare(password, user.password);
  if (passwordMatch) {
    return user;
  }
  else {
    throw new Error("Either the username or password is invalid.");
  }
}