import { closeConnection, dbConnection } from "../config/mongoConnection.js";
import * as users from "../data/users.js";
import * as posts from "../data/posts.js";

const db = await dbConnection();
await db.dropDatabase();

// seed
//displayed art is in the public domain via https://www.nga.gov/
let id = await users.addUser("Slackow", "Andrew", "Turcan", "s@a.com", "201-123-1324", "dude, a fella even", "Yeah great", "D0nt3nter!", true);
// try same username!
try {
  await users.addUser("Slackow", "Diff", "NamePleaseFail", "s@a.com", "201-123-1324", "dude, a fella even2", "Yeah great", "D0nt3nter!2", false);
} catch (err) {
  console.log("Encountered expected error:", err);
}

await posts.addPost(id, "Post", ["https://i.imgur.com/MMjejSF.jpeg"], "caption", ["keyword"]);
await posts.addPost(id, "YouTube thumbnails", ["https://img.youtube.com/vi/77PsqaWzwG0/0.jpg", "https://img.youtube.com/vi/QsnkNYnsn2c/0.jpg"], "caption", ["keyword"]);

//Updating posts
let simone = await users.addUser("simone", "Simone", "Martini", "simone@a.com", "201-123-1324", "I am a self taught artist.", "Looking to inspire others", "Testing12!", true);
let simonePost = await posts.addPost(simone, "Saint James Major", ['https://media.nga.gov/iiif/c05d6828-ce1c-4333-8ec6-b79ba3472fef/full/!384,384/0/default.jpg'], "Tempura", ["portrait"] );
await posts.updatePost(simonePost.toString(), simone, "Saint James Major", "Tempura on panel", ["portrait"]);
let simonePost2 = await posts.addPost(simone, "Saint", ["https://media.nga.gov/iiif/ce6b3e55-a43c-4555-949d-f6bf60600bce/full/!384,384/0/default.jpg"], "Tempura on panel", [], "");
await posts.updatePost(simonePost2.toString(), simone, "Saint Judas Thaddeus", "Tempura on panel", ["portrait"]);
let simonePost3 = await posts.addPost(simone, "Test Delete", ["https://media.nga.gov/iiif/ce6b3e55-a43c-4555-949d-f6bf60600bce/full/!384,384/0/default.jpg"], "Tempura on panel", [], "");
await posts.deletePostById(simonePost3.toString(), simone);

//post with comment and reply
let louis = await users.addUser("louis", "Louis-Léopold", "Boilly", "louis@a.com", "201-123-1324", "I am an artist from the 17th century.", "I enjoy drawing portraits", "Testing12!", true);
let louisPost = await posts.addPost(louis, "A Painter's Studio", ['https://media.nga.gov/iiif/d16f5ad4-d9f8-498a-9242-8821c5522254/full/!384,384/0/default.jpg'], "Oil on canvas", ["portrait"] );
let louisComment = await posts.addComment(louisPost.toString(), 'simone', 'I really love this piece.')
await posts.addReply(louisPost.toString(), louisComment._id.toString(), 'louis', 'Thank you!');

//new artist
let william = await users.addUser("william", "William", "Blake", "will@a.com", "201-123-1324", "I work with untraditional mediums.", "Drawing inspiration from the world.", "Testing12!", true);
try{
  await posts.addPost(william, "The Circle of the Lustful: Paolo and Francesca, 1827", ['https://media.nga.gov/iiif/d996368b-52e9-4e33-9eac-af57d538dd60/full/!384,384/0/default.jpg'], "Engraved copper plate", ["sculpture"] );
}
catch(e){
  console.log('Encountered expected error ', e)
}
let williamPost = await posts.addPost(william, "The Circle of the Lustful", ['https://media.nga.gov/iiif/d996368b-52e9-4e33-9eac-af57d538dd60/full/!384,384/0/default.jpg'], "Engraved copper plate", ["sculpture"] );
let williamComment = await posts.addComment(williamPost.toString(), 'simone', 'I really love this piece.')

//Post with comments
let comment = await posts.addPost(id, "A post with two photos", ["https://media.nga.gov/iiif/d8d65187-c9a5-4353-a634-bd8f0a4215ac/full/!384,384/0/default.jpg", "https://media.nga.gov/iiif/5a708b53-dff5-4361-8310-eb085949cab6/full/!384,384/0/default.jpg"], "Mixed mediums", ["landscape"]);
await posts.addComment(comment.toString(), "louis", "This is really great work.");
await posts.addComment(comment.toString(), "slackow", "A really long comment. A really long comment. A really long comment. A really long comment. A really long comment. A really long comment. A really long comment. A really long comment. A really long comment. A really long comment. A really long comment. A really long comment. A really long comment. A really long comment.");


//Post thread
let chris = await users.addUser("chris", "Chris", "Cool", "s@a.com", "201-123-1324", "Just a guy who likes to draw", "Doodles", "D0nt3nter!2", true);
let threadID = await users.getOrAddThread(chris, "A Zorua A day");
for (let i = 1; i <= 5; i++) {
  await posts.addPost(chris, `A Zorua A day ${i}`, [`/public/images/zorua${i}.jpeg`], "", [], threadID);
}


//Like functionality
let sally = await users.addUser("sally", "Sally", "Seashell", "sally@a.com", "201-123-1324", "I'm sally", "", "D0nt3nter!2", false);
await posts.addLike(louisPost.toString(), sally);
await posts.addLike(williamPost.toString(), sally);
await posts.addLike(comment.toString(), sally);
//check removeLike is working
await posts.removeLike(comment.toString(), sally)

let nick = await users.addUser("npalladino", "Nicholas", "Palladino", "n@a.com", "201-874-2354", "I'm me, for sure", "yuh", "Bruh123.#", true);
let nickjr = await users.addUser("npalladi", "Nicholas", "Palladino", "n@a.com", "201-874-2354", "I'm me, but artist", "", "Bruh123.#", false);
await users.addReview("npalladino", "Bro's pretty good at this", "npalladi");
console.log("Added Review successfully!");
//all combos of bad inputs: reviewing yourself, reviewing non-artist, reviewing non-artist that is you, double reviewing an account (updates current review)
try {
  await users.addReview("npalladino", "Bro's actually the best at this", "npalladino");
} catch (err) {
  console.log("Encountered expected error:", err);
}
try {
  await users.addReview("npalladi", "Bro isn't even an artist but he's good", "npalladino");
} catch (err) {
  console.log("Encountered expected error:", err);
}
try {
  await users.addReview("chris", "Bro isn't even an artist but he's THE BEST EVER", "chris");
} catch (err) {
  console.log("Encountered expected error:", err);
}
await users.addReview("npalladino", "Bro's fallen off actually, not that good anymore lol", "npalladi");
console.log("Added Review successfully!");

console.log("Done seeding database");

await closeConnection();