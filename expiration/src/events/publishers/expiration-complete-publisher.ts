import {
  Subjects,
  Publisher,
  ExpirationCompleteEvent,
} from "@oldledger/common";

export class ExpirationCompletePublisher extends Publisher<ExpirationCompleteEvent> {
  readonly subject = Subjects.ExpirationComplete;
}
