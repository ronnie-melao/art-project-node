// https://github.com/stevens-cs546-cs554/CS-546/tree/master/lecture_06/intermediate_api/config
import { dbConnection } from "./mongoConnection.js";

/* This will allow you to have one reference to each collection per app */
/* Feel free to copy and paste this */
const getCollectionFn = (collection, onStart) => {
  let _col = undefined;

  return async () => {
    if (!_col) {
      const db = await dbConnection();
      _col = await db.collection(collection);
      onStart?.(_col);
    }

    return _col;
  };
};

/* Now, you can list your collections here: */
export const getPostCollection = getCollectionFn("posts", posts => {
  // index search terms
  posts.createIndex({ searchTerms: 1 });
});
export const getUserCollection = getCollectionFn("users", users => {
  // index usernames and ensure they are unique
  users.createIndex({ username: 1 }, { unique: true });
});
export const getCommissionCollection = getCollectionFn("commissions");