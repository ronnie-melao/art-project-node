import { getCommissionCollection, getUserCollection } from "../config/mongoCollections.js";
import { validateString } from "./validators.js";
import xss from "xss";

export const addCommission = async (artistUsername, requesterUsername, description, price) => {
  if (!artistUsername) throw "No artist!";
  if (!description) throw "No description!";
  if (!price) throw "No price!";
  if (!requesterUsername) throw "You are not signed in!";
  description = description.trim();

  description = validateString(description);
  if (isNaN(price)) throw "Price must be a number!";

  description = validateString(description);
    if (description.includes("<") || description.includes(">")) {
      throw "Write a new description!";
    }
    description = xss(description);

  if (artistUsername === requesterUsername) throw "You cannot request commissions to yourself!";

  const users = await getUserCollection();
  const existingArtist = await users.findOne({username: artistUsername});
  if (!existingArtist || !existingArtist.isArtist) throw "This artist does not exist!";

  const commissions = await getCommissionCollection();
  let commission = {
    artistUsername: artistUsername,
    requesterUsername: requesterUsername,
    status: "Pending",
    description: description,
    price: price,
  };

  let newInsertInformation = await commissions.insertOne(commission);

  if (!newInsertInformation.insertedId) throw "Commission failed!";
  return newInsertInformation.insertedId.toString();
};

export const getArtistCommissions = async (artistUsername) => {
  if (!artistUsername) throw "No artist associated!";
  const commissions = await getCommissionCollection();
  const artistCommissions = commissions.find({ artistUsername: artistUsername });
  const commissionsArray = await artistCommissions.toArray();
  return commissionsArray;
};

export const getRequestedCommissions = async (requesterUsername) => {
  if (!requesterUsername) throw "No requester associated!";
  const commissions = await getCommissionCollection();
  const outgoingCommissions = commissions.find({ requesterUsername: requesterUsername });
  const outgoingCommissionsArray = await outgoingCommissions.toArray();
  return outgoingCommissionsArray;
};