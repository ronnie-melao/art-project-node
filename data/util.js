import xss from "xss";

/**
 * @param {*} any
 * @return {*}
 */
export const deepXSS = (any) => {
  if (any == null) return any;
  if (typeof any === "string") {
    return xss(any);
  }
  if (Array.isArray(any)) {
    let result = [];
    any.forEach(el => {
      result.push(deepXSS(el));
    });
    return result;
  }
  if (typeof any === "object") {
    if (any instanceof Date) {
      return any;
    }
    let result = {};
    for (let [key, val] of Object.entries(any)) {
      result[xss(key)] = deepXSS(val);
    }
    return result;
  }
  return any;
};

/**
 * @param {string|string[]} args
 */
export const getSearchTerms = (...args) => {
  let result = new Set();
  for (let terms of args) {
    if (typeof terms === "string") {
      terms = terms.split(/\s+/);
    }
    terms.forEach(term => result.add(term.trim().toLowerCase()));
  }
  return [...result];
};

export const DUPLICATE_ID_ERROR_CODE = 11000;
export const SALT_ROUNDS = 12;