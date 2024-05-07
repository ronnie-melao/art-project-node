import { getCommissionCollection, getUserCollection } from "../config/mongoCollections.js";
import { validateString } from "./validators.js";

export const addCommission = async (artistUsername, requesterUsername, description, price) => {
  if (!artistUsername) throw "No artist!";
  if (!description) throw "No description!";
  if (!price) throw "No price!";
  description = description.trim();

  description = validateString(description);
  if (isNaN(price)) throw "Price must be a number!";

  const users = await getUserCollection();
  const existingArtist = await users.findOne({username: artistUsername});
  if (!existingArtist) throw "This artist does not exist!";

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