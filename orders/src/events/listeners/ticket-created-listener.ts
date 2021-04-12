import { Message } from "node-nats-streaming";
import { Subjects, Listener, TicketCreatedEvent } from "@oldledger/common";
import { Ticket } from "../../models/ticket";
import { queueGroupName } from "./queue-group-name";

export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
  subject: Subjects.TicketCreated = Subjects.TicketCreated;
  queueGroupName = queueGroupName;

  // msg contains the ack method that we use to acknowledge an
  // event after it has been successfully processed
  async onMessage(data: TicketCreatedEvent["data"], msg: Message) {
    const { id, title, price } = data;

    // We use this ticket created listener to implement data replication
    // in our local database for Tickets, so we don't have to reach across
    // to the main ticket service for information about tickets
    const ticket = Ticket.build({
      id,
      title,
      price,
    });
    await ticket.save();

    msg.ack();
  }
}
