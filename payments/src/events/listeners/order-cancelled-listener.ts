import { OrderCancelledEvent, Subjects, Listener } from "@oldledger/common";
import { Message } from "node-nats-streaming";
import { queueGroupName } from "./queue-group-name";
import { Order, OrderStatus } from "../../models/order";

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
  queueGroupName = queueGroupName;

  async onMessage(data: OrderCancelledEvent["data"], msg: Message) {
    const order = await Order.findOne({
      _id: data.id,
      // Version is not strictly needed since we only ever create or cancel
      // an order at the moment. However, we can include it to future proof
      // the code if we ever have to handle something like an order updated
      // event for instance
      version: data.version - 1,
    });

    if (!order) {
      return console.log("Order not found");
      // throw new Error("Order not found");
    }

    order.set({ status: OrderStatus.Cancelled });
    await order.save();

    msg.ack();
  }
}
