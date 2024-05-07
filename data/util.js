import xss from "xss";
import c from "ansi-colors";
import heic from "heic-convert";
import { ObjectId } from "mongodb";
import path from "node:path";
import * as fs from "node:fs";
import { pdf } from "pdf-to-img";

const __dirname = import.meta.dirname;
/**
 * @param {*} any
 * @param {boolean} noMercy
 * @return {*}
 */
export const deepXSS = (any, noMercy = false) => {
  if (any == null) return any;
  if (typeof any === "string") {
    return xss(any, noMercy ? { whiteList: {} } : undefined);
  }
  if (Array.isArray(any)) {
    let result = [];
    any.forEach(el => {
      result.push(deepXSS(el, noMercy));
    });
    return result;
  }
  if (typeof any === "object") {
    if (any instanceof Date) {
      return any;
    }
    let result = {};
    for (let [key, val] of Object.entries(any)) {
      result[key] = deepXSS(val, noMercy);
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

export const convertHEIC = async (file) => {
  if (file.mimetype === "image/heic") {
    // adapted from https://www.npmjs.com/package/heic-convert
    console.log(heic, Object.keys(heic));
    file.data = await heic({
      buffer: file.data,
      format: "JPEG",
      quality: 1,
    });
    file.mimetype = "image/jpeg";
  }
  return file;
};

export const convertPDF = async (file) => {
  if (file.mimetype === "application/pdf") {
    try {
      const dataUrl = `data:application/pdf;base64,${file.data.toString("base64")}`;
      const doc = await pdf(dataUrl, { scale: 2.0 });
      if (doc.length > 0) {
        for await (const page of doc) {
          console.log(page);
          file.data = page;
          file.mimetype = "image/png";
          break;
        }
      } else {
        console.error("No pages were converted.");
      }
    } catch (error) {
      console.error("Error during PDF conversion:", error);
      throw "Error during PDF conversion:";
    }
  }
  return file;
};

export const imageFilesToLinks = async (files) => {
  let result = [];
  try {
    for (let file of files) {
      let fName = new ObjectId().toString() + "-" + file.mimetype.replace("/", ".");
      let filePath = path.join(__dirname, "../public/images/", fName);
      fs.writeFileSync(filePath, file.data);
      result.push(`/public/images/${fName}`);
    }
  } catch (e) {
    console.log(e);
    throw "Error uploading image";
  }
  return result;
};

export const removeImageIfLocal = async (file) => {
  if (typeof file !== "string") return;
  if (!file.startsWith("/public") || !file.includes("image")) return;
  let filePath = path.join(__dirname, "..", file);
  fs.unlinkSync(filePath);
};

export const DUPLICATE_ID_ERROR_CODE = 11000;
export const SALT_ROUNDS = 12;