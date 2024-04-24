import { closeConnection, dbConnection } from "../config/mongoConnection.js";
import * as users from "../data/users.js";
import * as posts from "../data/posts.js";

const db = await dbConnection();
await db.dropDatabase();

// seed
let id = await users.addUser("Slackow", "Andrew", "Turcan", "s@a.com", "201-123-1324", "dude, a fella even", "Yeah great", "D0nt3nter!", false);
// try same username!
try {
  await users.addUser("Slackow", "Diff", "NamePleaseFail", "s@a.com", "201-123-1324", "dude, a fella even2", "Yeah great", "D0nt3nter!2", true);
} catch (err) {
  console.log("Encountered expected error, duplicate username");
}

await posts.addPost(id, "Post", ["https://i.imgur.com/MMjejSF.jpeg"], "caption", ["keyword"], "");

console.log("Done seeding database");

await closeConnection();