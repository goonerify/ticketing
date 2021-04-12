import { Publisher, OrderCreatedEvent, Subjects } from "@oldledger/common";

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
  subject: Subjects.OrderCreated = Subjects.OrderCreated;
}
