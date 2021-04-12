import { Message } from "node-nats-streaming";
import {
  Subjects,
  Listener,
  ExpirationCompleteEvent,
  OrderStatus,
} from "@oldledger/common";
import { queueGroupName } from "./queue-group-name";
import { Order } from "../../models/order";
import { OrderCancelledPublisher } from "../publishers/order-cancelled-publisher";

export class ExpirationCompleteListener extends Listener<ExpirationCompleteEvent> {
  readonly subject = Subjects.ExpirationComplete;
  queueGroupName = queueGroupName;

  // msg contains the ack method that we use to acknowledge an
  // event after it has been successfully processed
  async onMessage(data: ExpirationCompleteEvent["data"], msg: Message) {
    const { orderId } = data;

    // We use this ticket created listener to implement data replication
    // in our local database for Tickets, so we don't have to reach across
    // to the main ticket service for information about tickets
    const order = await Order.findById(orderId).populate("ticket");

    if (!order) {
      return console.log(`Order with id ${orderId} not found`);
      // throw new Error("Order not found");
    }

    if (order.status === OrderStatus.Complete) {
      return msg.ack();
    }

    order.set({
      status: OrderStatus.Cancelled,
      // ticket: null,

      // We don't have to dereference the ticket since our isReserved function
      // that is used to determine is an order can be placed on a ticket includes
      // the status criteria that an order must not be cancelled for it to be reserved.
      // Therefore, we can leave in the ticket reference so that users can still see the
      // ticket that the cancelled order was associated with
    });

    await order.save();

    await new OrderCancelledPublisher(this.client).publish({
      id: order.id,
      version: order.version,
      ticket: {
        id: order.ticket.id,
      },
    });

    msg.ack();
  }
}
