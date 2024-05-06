import { getCommissionCollection } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import { validateString } from "./validators.js";

export const addCommission = async (artistUsername, requesterUsername, description, price) => {
   if (!description) throw "No description!";
   if (!price) throw "No price!";
    description = description.trim();

   description = validateString(description);
   if (isNaN(price)) throw "Price must be a number!";
   
    const commissions = await getCommissionCollection();
    let commission = {
        artistUsername: artistUsername,
        requesterUsername: requesterUsername,
        status: "Pending",
        description: description,
        price: price
        }

    let newInsertInformation = await commissions.insertOne(commission);

    if (!newInsertInformation.insertedId) throw "Commission failed!";
    return newInsertInformation.insertedId.toString();
  };

export const getArtistCommissions = async (artistUsername) => {
    if (!artistUsername) throw "No artist associated!";
    const commissions = await getCommissionCollection();
    const artistCommissions = commissions.find({ username: artistUsername });
    const commissionsArray = await artistCommissions.toArray();
    return commissionsArray;
};