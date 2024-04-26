import { closeConnection, dbConnection } from "../config/mongoConnection.js";
import * as users from "../data/users.js";
import * as posts from "../data/posts.js";

const db = await dbConnection();
await db.dropDatabase();

// seed
let id = await users.addUser("Slackow", "Andrew", "Turcan", "s@a.com", "201-123-1324", "dude, a fella even", "Yeah great", "D0nt3nter!", true);
// try same username!
try {
  await users.addUser("Slackow", "Diff", "NamePleaseFail", "s@a.com", "201-123-1324", "dude, a fella even2", "Yeah great", "D0nt3nter!2", false);
} catch (err) {
  console.log("Encountered expected error:", err);
}

await posts.addPost(id, "Post", ["https://i.imgur.com/MMjejSF.jpeg"], "caption", ["keyword"]);
await posts.addPost(id, "YouTube thumbnails", ["https://img.youtube.com/vi/77PsqaWzwG0/0.jpg", "https://img.youtube.com/vi/QsnkNYnsn2c/0.jpg"], "caption", ["keyword"]);

console.log("Done seeding database");

await closeConnection();