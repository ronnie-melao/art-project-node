import { ObjectId } from "mongodb";

/**
 * @param {string} input
 * @param {boolean} lower
 * @param {number[]} length
 * @return {string}
 */
export const validateString = (input, { lower = false, length = [1] } = {}) => {
  if (typeof input === "string") {
    const res = lower ? input.trim().toLowerCase() : input.trim();
    const [lowBound, highBound] = length;
    if (res.length < lowBound)
      throw `String Too Small!: (${res.length} < ${lowBound}}`;
    if (highBound != null && res.length > highBound)
      throw `String Too Large!: (${res.length} > ${highBound}}`;
    return res;
  }
  throw `Not a string! '${JSON.stringify(input)}'`;
};

/**
 * @param {string} input
 * @return {string}
 */
export const validateId = (input) => {
  input = validateString(input);
  if (!ObjectId.isValid(input)) throw `Not ObjectID: ${input}`;
  return input;
};

/**
 * @param {string} input
 * @return {string}
 */
export const validateDate = (input) => {
  if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(input)) {
    throw `Date invalid '${input}'`;
  }
  let [monthS, dayS, yearS] = input.split("/");
  let date = new Date(+yearS, +monthS - 1, +dayS);
  if (
    date > new Date() ||
    date.getFullYear() !== +yearS ||
    date.getMonth() !== +monthS - 1 ||
    date.getDate() !== +dayS
  ) {
    throw `Date invalid '${input}'`;
  }
  return input;
};

/**
 * @param {boolean} input
 * @return {boolean}
 */
export const validateBoolean = (input) => {
  if (typeof input != "boolean") throw `Not a boolean: '${input}'`;
  return input;
};

/**
 * @param {any} input
 * @param {?[number,number]} range
 * @param {boolean} whole
 * @return {number}
 * */
export const validateNumber = (input, { range = [], whole = false } = {}) => {
  if (typeof input === "number") {
    let [lower, upper] = range;
    if ((lower != null && input < lower) || (upper != null && input > upper)) {
      throw `${input} is not in range [${lower ?? ""},${upper ?? ""}]`;
    }
    if (whole && !Number.isInteger(input)) {
      throw `Not an integer! '${input}'`;
    }
    return input;
  }
  throw `Not a number! '${JSON.stringify(input)}'`;
};

/**
 * @param {any} input
 * @param {?[number,number]} length
 * @param {function(Object):Object} validator
 * @return {any[]}
 * */
export const validateArray = (
  input,
  { length = [1], validator = (e) => e } = {}
) => {
  if (!Array.isArray(input)) throw `Not an Array: ${JSON.stringify(input)}`;
  if (length != null) {
    let [lower, upper] = length;
    if (
      (lower != null && lower > input.length) ||
      (upper != null && upper < input.length)
    ) {
      throw `Array length (${input.length}) not in range [${lower ?? ""},${upper ?? ""}]`;
    }
    return input.map(validator);
  }
};

/**
 * @param {Object[]} errors
 * @param {Object} inputObj
 * @param {function} validator
 * @param {*} args
 */
export const tryOrPushErr = (errors, inputObj, validator, ...args) => {
  if (typeof inputObj !== "object" &&
    !Array.isArray(inputObj) &&
    Object.keys(inputObj).length === 1) {
    throw "Incorrect inputObj type";
  }
  // name is the name of the field, as it should show up in the array
  let [[name, input]] = Object.entries(inputObj);
  try {
    let value = validator(input, ...args);
    return { value };
  } catch (error) {
    // push the error to the array under the name of the field
    errors.push({ [name]: error });
    return null;
  }
};