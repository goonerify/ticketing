import { Message } from "node-nats-streaming";
import {
  Subjects,
  Listener,
  PaymentCreatedEvent,
  OrderStatus,
} from "@oldledger/common";
import { queueGroupName } from "./queue-group-name";
import { Order } from "../../models/order";
import { OrderCreatedPublisher } from "../publishers/order-created-publisher";

export class PaymentCreatedListener extends Listener<PaymentCreatedEvent> {
  subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
  queueGroupName = queueGroupName;

  async onMessage(data: PaymentCreatedEvent["data"], msg: Message) {
    const order = await Order.findById(data.orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    order.set({
      status: OrderStatus.Complete,
    });

    await order.save();

    // IMPORTANT: We should normally publish an order updated event to ensure
    // that all listeners in other services increment their versions of the order,
    // however, we haven't done so here because the order status is now complete.
    // In the context of this application, once an order is completed, it will not
    // be edited any further. Also, we only ever actually have a created, cancelled
    // and deleted status for an order (even though we created an AwaitingPayment)
    // event, so we haven't implemented an OrderUpdatedPublisher just yet

    // new OrderUpdatedPublisher(this.client).publish(order)

    msg.ack();
  }
}
