import { Subjects, Publisher, OrderCancelledEvent } from "@oldledger/common";

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
  subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
}
