import express, { Request, Response } from "express";
import { body } from "express-validator";
import mongoose from "mongoose";
import { requireAuth } from "@oldledger/common";
import { Order } from "../models/order";

const router = express.Router();

router.get(
  "/api/orders",
  requireAuth,
  [
    body("ticketId")
      .not()
      .isEmpty()
      // Validate id is mongo id type. This introduces tight coupling with the tickets
      // service by making assumptions about the db used to generate the ticketId
      .custom((input: string) => mongoose.Types.ObjectId.isValid(input))
      .withMessage("TicketId must be provided"),
  ],
  async (req: Request, res: Response) => {
    const orders = await Order.find({
      userId: req.currentUser!.id,
    }).populate("ticket");

    res.send(orders);
  }
);

export { router as indexOrderRouter };
