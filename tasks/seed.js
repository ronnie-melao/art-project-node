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

//Post with comments
let comment = await posts.addPost(id, "Comment Post", ["https://img.youtube.com/vi/77PsqaWzwG0/0.jpg", "https://img.youtube.com/vi/QsnkNYnsn2c/0.jpg"], "caption", ["keyword"]);
await posts.addComment(comment.toString(), "User1", "This is really great work.");
await posts.addComment(comment.toString(), "User2", "A really long comment. A really long comment. A really long comment. A really long comment. A really long comment. A really long comment. A really long comment. A really long comment. A really long comment. A really long comment. A really long comment. A really long comment. A really long comment. A really long comment.");

//Post with replies
let replyPost = await posts.addPost(id, "Replies Post", ["https://img.youtube.com/vi/77PsqaWzwG0/0.jpg", "https://img.youtube.com/vi/QsnkNYnsn2c/0.jpg"], "caption", ["keyword"]);
let commentOnPost = await posts.addComment(replyPost.toString(), "User1", "This is really great work.");
await posts.addReply(replyPost.toString(), commentOnPost._id.toString(), "username1", 'This should be a reply');
//Post thread


let chris = await users.addUser("chris", "Chris", "Cool", "s@a.com", "201-123-1324", "dude, a fella even5", "Yeah great3", "D0nt3nter!2", true);
let threadID = await users.getOrAddThread(chris, "A Zorua A day");
for (let i = 1; i <= 5; i++) {
  await posts.addPost(chris, `A Zorua A day ${i}`, [`/public/images/zorua${i}.jpeg`], "", [], threadID);
}


console.log("Done seeding database");

await closeConnection();