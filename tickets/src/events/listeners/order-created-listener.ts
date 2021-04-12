import { Message } from "node-nats-streaming";
import { Listener, OrderCreatedEvent, Subjects } from "@oldledger/common";
import { queueGroupName } from "./queue-group-name";
import { Ticket } from "../../models/ticket";
import { TicketUpdatedPublisher } from "../publishers/ticket-updated-publisher";

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  subject: Subjects.OrderCreated = Subjects.OrderCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCreatedEvent["data"], msg: Message) {
    // Find the ticket that the order is reserving
    const ticket = await Ticket.findById(data.ticket.id);

    // If no ticket, throw error
    if (!ticket) {
      return console.log(`Ticket with id '${data.ticket.id}' not found`);
    }

    // Mark the ticket as being reserved by setting its orderId property
    ticket.set({ orderId: data.id });

    // Save the ticket
    await ticket.save();

    // Ensure we await the publish so that ack is never called if
    // something goes wrong with publishing
    await new TicketUpdatedPublisher(this.client).publish({
      id: ticket.id,
      // Version would have been incremented by mongoose-update-if-version
      // plugin after saving the document
      version: ticket.version,
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId,
      orderId: ticket.orderId,
    });

    // ack the message
    msg.ack();
  }
}
