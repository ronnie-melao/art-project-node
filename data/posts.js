import { tryOrPushErr, validateArray, validateString } from "./validators.js";

/**
 * Makes a post given the parameters within an object
 * Errors are thrown in an array, that array lists all the errors.
 */
export const addPost = (title, images, description, keywords, threadID) => {
  let errors = [];
  title = tryOrPushErr(errors, { title }, validateString);
  threadID = tryOrPushErr(errors, { threadID }, validateString);
  images = tryOrPushErr(errors, { images }, validateArray, { validator: validateString });
  description = tryOrPushErr(errors, { description }, validateString);
  keywords = tryOrPushErr(errors, { keywords }, validateArray, { validator: validateString });
  if (errors.length > 0) {
    throw errors;
  }
  // TODO make post
};