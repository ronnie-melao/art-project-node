import xss from "xss";

/**
 * @param {*} any
 * @return {*}
 */
const deepXSS = (any) => {
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
    let result = {};
    for (let [key, val] of Object.entries(any)) {
      result[xss(key)] = deepXSS(val);
    }
    return result;
  }
  return any;
};