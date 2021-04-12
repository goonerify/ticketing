import mongoose from "mongoose";
import { Message } from "node-nats-streaming";
import { OrderCancelledEvent } from "@oldledger/common";
import { natsWrapper } from "../../../nats-wrapper";
import { OrderCancelledListener } from "../order-cancelled-listener";
import { Ticket } from "../../../models/ticket";

const setup = async () => {
  const listener = new OrderCancelledListener(natsWrapper.client);

  const orderId = mongoose.Types.ObjectId().toHexString();
  const ticket = Ticket.build({
    title: "concert",
    price: 20,
    userId: "asdf",
  });
  // orderId is not available when a ticket is created so set after creation
  ticket.set({ orderId });
  await ticket.save();

  const data: OrderCancelledEvent["data"] = {
    id: orderId,
    // Version of the order doesn't matter because we don't care about it in this listener
    version: 0,
    ticket: {
      id: ticket.id,
    },
  };

  // @ts-ignore because we only implement the properties of Message that we require
  const msg: Message = {
    ack: jest.fn(),
  };

  return { msg, data, ticket, orderId, listener };
};

// TODO: Split the test below into 3 individual tests
it("updates the ticket, publishes an event, and acks the message", async () => {
  const { msg, data, ticket, orderId, listener } = await setup();

  await listener.onMessage(data, msg);

  const updatedTicket = await Ticket.findById(ticket.id);
  expect(updatedTicket!.orderId).not.toBeDefined();
  expect(msg.ack).toHaveBeenCalled();
  expect(natsWrapper.client.publish).toHaveBeenCalled();

  // check that the function is called with the correct arguments
  const ticketUpdatedData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
  );

  // Verify the publish function was called with the proper ticket id
  expect(ticket.id).toEqual(ticketUpdatedData.id);
});
