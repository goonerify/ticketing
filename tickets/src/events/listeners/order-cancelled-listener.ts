import { Listener, OrderCancelledEvent, Subjects } from "@oldledger/common";
import { Message } from "node-nats-streaming";
import { queueGroupName } from "./queue-group-name";
import { Ticket } from "../../models/ticket";
import { TicketUpdatedPublisher } from "../publishers/ticket-updated-publisher";

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCancelledEvent["data"], msg: Message) {
    const ticket = await Ticket.findById(data.ticket.id);

    if (!ticket) {
      return console.log("Ticket not found");
      // throw new Error("Ticket not found");
    }

    // Reset the value of orderId to free up this ticket for future orders
    // Use undefined instead of null because optional values with the ? indicator
    // that we use when defining the orderId in several instances to denote
    // that it's optional, don't always work well with null in typescript
    ticket.set({ orderId: undefined });
    await ticket.save();
    // Important  to await the call to publish below so that we don't ack if publish fails
    await new TicketUpdatedPublisher(this.client).publish({
      id: ticket.id,
      orderId: ticket.orderId,
      userId: ticket.userId,
      price: ticket.price,
      title: ticket.title,
      version: ticket.version,
    });

    msg.ack();
  }
}
