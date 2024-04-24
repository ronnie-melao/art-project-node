// https://github.com/stevens-cs546-cs554/CS-546/tree/master/lecture_06/intermediate_api/config
import { dbConnection } from "./mongoConnection.js";

/* This will allow you to have one reference to each collection per app */
/* Feel free to copy and paste this */
const getCollectionFn = (collection, onStart = _ => {
}) => {
  let _col = undefined;

  return async () => {
    if (!_col) {
      const db = await dbConnection();
      _col = await db.collection(collection);
      onStart(_col);
    }

    return _col;
  };
};

/* Now, you can list your collections here: */
export const getPostCollection = getCollectionFn("posts");
export const getUserCollection = getCollectionFn("users", users => {
  users.createIndex({ username: 1 }, { unique: true });
});
export const getCommissionCollection = getCollectionFn("commissions");