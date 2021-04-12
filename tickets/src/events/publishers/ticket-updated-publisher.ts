import { Publisher, Subjects, TicketUpdatedEvent } from "@oldledger/common";

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
  subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
}
