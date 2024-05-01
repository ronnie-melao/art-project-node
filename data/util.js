import xss from "xss";
import c from "ansi-colors";

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
  return [...result].filter(s => s.length > 1);
};

/**
 * @param {string} s
 */
export const prettyHttpMethod = (s) => {
  // based on PostMan's color scheme
  const colorFuncs = {
    GET: c.greenBright,
    POST: c.yellowBright,
    PUT: c.cyan,
    PATCH: c.magentaBright,
    DELETE: c.redBright,
  };
  return (colorFuncs[s.toUpperCase()] ?? c.blueBright)(s);
};

// adapted from  https://stackoverflow.com/a/52810852
const relativeTimePeriods = {
  year: 31536000,
  month: 2419200,
  week: 604800,
  day: 86400,
  hour: 3600,
  minute: 60,
  second: 1,
};
export const relativeTime = (date) => {
  // number of milliseconds to date
  if (!(date instanceof Date)) date = new Date(date);
  const seconds = (new Date() - date) / 1000;
  for (let [name, secondsPer] of Object.entries(relativeTimePeriods)) {
    if (seconds >= secondsPer) {
      const amount = Math.floor(seconds / secondsPer);
      return `${amount} ${name}${amount !== 1 ? "s" : ""} ago`;
    }
  }
  return "Just now";
};

export const DUPLICATE_ID_ERROR_CODE = 11000;
export const SALT_ROUNDS = 12;