import { Message } from "node-nats-streaming";
import { Subjects, Listener, TicketUpdatedEvent } from "@oldledger/common";
import { Ticket } from "../../models/ticket";
import { queueGroupName } from "./queue-group-name";

export class TicketUpdatedListener extends Listener<TicketUpdatedEvent> {
  subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
  queueGroupName = queueGroupName;

  async onMessage(data: TicketUpdatedEvent["data"], msg: Message) {
    const ticket = await Ticket.findByEvent(data);

    if (!ticket) {
      // Throws an error if a ticket with id was not found,
      // or a ticket with the appropriate version was not found

      // Note: Throwing an error here causes the NATS streaming server
      // to stop/break. We console.log and return early instead
      // throw new Error("Ticket not found");
      return console.log(`Ticket with id '${data.id}' not found`);
    }

    const { title, price } = data;
    ticket.set({ title, price });
    // Note that the update-if-current plugin will update the version
    // when this record is saved to the database
    await ticket.save();

    msg.ack();
  }
}
