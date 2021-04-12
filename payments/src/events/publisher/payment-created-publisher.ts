import { Subjects, Publisher, PaymentCreatedEvent } from "@oldledger/common";

export class PaymentCreatedPublisher extends Publisher<PaymentCreatedEvent> {
  readonly subject = Subjects.PaymentCreated;
}
