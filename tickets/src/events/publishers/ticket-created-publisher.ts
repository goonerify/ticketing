import { Publisher, Subjects, TicketCreatedEvent } from "@oldledger/common";

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
  readonly subject = Subjects.TicketCreated;
}
