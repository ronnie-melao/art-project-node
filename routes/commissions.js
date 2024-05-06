import { Router } from "express";
import { getCommissionCollection } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";

let router = new Router();

router.route("/change-status").post(async (req, res) => {
    try {
        const { commissionId, newStatus } = req.body;
        const commissions = await getCommissionCollection();

        let statusChange = await commissions.updateOne(
            { _id: ObjectId.createFromHexString(commissionId) },
            { $set: { status: newStatus } }
        );
        if (statusChange.modifiedCount === 0)
            throw 'No documents matched the update criteria';

    } catch (e) {
        res.status(500).render('commissions');
    }

});

export default router;