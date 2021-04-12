// TODO: Write tests to ensure the user is authenticated, body has valid ticket id etc

import request from "supertest";
import { app } from "../../app";
import mongoose from "mongoose";
import { Ticket } from "../../models/ticket";
import { Order, OrderStatus } from "../../models/order";
import { natsWrapper } from "../../nats-wrapper";

it("cannot be accessed if the user is not signed in", async () => {
  request(app).post("/api/orders").send({}).expect(401);
});

it("cannot be accessed if an invalid ticket id is provided", async () => {
  request(app)
    .post("/api/orders")
    .set("Cookie", global.signin())
    .send({
      ticketId: "asldkf",
    })
    .expect(400);
});

it("returns an error if the ticket does not exist", async () => {
  const ticketId = mongoose.Types.ObjectId();

  await request(app)
    .post("/api/orders")
    .set("Cookie", global.signin())
    .send({ ticketId })
    .expect(404);
});

it("returns an error if the ticket is already reserved", async () => {
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: "concert",
    price: 20,
  });

  await ticket.save();

  const order = Order.build({
    ticket,
    userId: "lkjijhiknoih",
    status: OrderStatus.Created,
    expiresAt: new Date(),
  });

  order.save();

  await request(app)
    .post("/api/orders")
    .set("Cookie", global.signin())
    .send({ ticketId: ticket.id })
    .expect(400);
});

it("reserves a ticket", async () => {
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: "concert",
    price: 20,
  });

  await ticket.save();

  let orders = await Order.find({});

  expect(orders).toHaveLength(0);

  await request(app)
    .post("/api/orders")
    .set("Cookie", global.signin())
    .send({ ticketId: ticket.id })
    .expect(201);

  orders = await Order.find({});
  expect(orders).toHaveLength(1);
});

it("emits an order created event", async () => {
  const ticket = Ticket.build({
    id: new mongoose.Types.ObjectId().toHexString(),
    title: "concert",
    price: 20,
  });

  await ticket.save();

  await request(app)
    .post("/api/orders")
    .set("Cookie", global.signin())
    .send({ ticketId: ticket.id })
    .expect(201);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
