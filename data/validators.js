import { ObjectId } from "mongodb";

/**
 * @typedef {(any) => boolean} predicate - function that returns a bool
 * @typedef {number[]} range - specifies a numeral range:
 * [] => any number (no bounds)
 * [number] => just lower bound
 * [null, number] => just upper bound
 * [number, number] => lower and upper bound
 */

/**
 * @param {string} input - the string to validate
 * @param {boolean} lower - if the string should be set to lowercase
 * @param {range} length - length constraints in the form of an array
 * @param {predicate[]} conditions - additional conditions that take any function string => bool
 * @return {string} - the validated string (trimmed)
 */
export const validateString = (input, { lower = false, length = [1], conditions = [] } = {}) => {
  // All the fields in the braces are supplied inside an object passed in.
  // empty strings invalid by default, because length has lower bound of 1
  // ex: username = validateString(username, { lower: false, length: [1,16] });
  if (typeof input === "string") {
    const res = lower ? input.trim().toLowerCase() : input.trim();
    const [lowBound, highBound] = length;
    if (lowBound != null && res.length < lowBound)
      throw `String Too Small!: (${res.length} < ${lowBound}}`;
    if (highBound != null && res.length > highBound)
      throw `String Too Large!: (${res.length} > ${highBound}}`;
    if (!conditions.every(predicate => predicate(input))) {
      throw `String failed a condition: ${conditions}`;
    }
    return res;
  }
  throw `Not a string! '${JSON.stringify(input)}'`;
};

/**
 * @param {string} input - id to validate
 * @return {string} - the validated id
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
 * @param {range} range
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
 * @param {range} length
 * @param {function(Object):Object} validator
 * @return {any[]}
 * */
export const validateArray = (
  input,
  { length = [1], validator = (e) => e } = {},
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