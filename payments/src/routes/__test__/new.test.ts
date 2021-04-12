import mongoose from "mongoose";
import request from "supertest";
import { OrderStatus } from "@oldledger/common";
import { app } from "../../app";
import { Order } from "../../models/order";
import { stripe } from "../../stripe";
import { Payment } from "../../models/payment";

// Inform jest that we are mocking this file with any
// file of the same name within a __mocks__ directory

// Uncomment line below to activate mock implementation
// jest.mock("../../stripe.ts");

it("returns a 404 when purchasing an order that does not exist", async () => {
  await request(app)
    .post("/api/payments")
    .set("Cookie", global.signin())
    .send({
      token: "asldkfj",
      orderId: mongoose.Types.ObjectId().toHexString(),
    })
    .expect(404);
});

it("returns a 401 when purchasing an order that doesn't belong to the user", async () => {
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    userId: mongoose.Types.ObjectId().toHexString(),
    version: 0,
    price: 20,
    status: OrderStatus.Created,
  });
  await order.save();

  // Try to pay for the order as any arbitrary user
  await request(app)
    .post("/api/payments")
    .set("Cookie", global.signin())
    .send({
      token: "asldkfj",
      orderId: order.id,
    })
    .expect(401);
});

it("returns a 400 when purchasing a cancelled order", async () => {
  const userId = mongoose.Types.ObjectId().toHexString();
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    userId,
    version: 0,
    price: 20,
    status: OrderStatus.Cancelled,
  });
  await order.save();

  await request(app)
    .post("/api/payments")
    .set("Cookie", global.signin(userId))
    .send({
      orderId: order.id,
      token: "asdlkfj",
    })
    .expect(400);
});

// // Mock Implementation without Stripe
// // Rename __mocks__/stripe.ts.old to __mocks__/stripe.ts to use
// it("returns a 201 with valid inputs", async () => {
//   const userId = mongoose.Types.ObjectId().toHexString();
//   const order = Order.build({
//     id: mongoose.Types.ObjectId().toHexString(),
//     userId,
//     version: 0,
//     price: 20,
//     status: OrderStatus.Created,
//   });
//   await order.save();

//   await request(app)
//     .post("/api/payments")
//     .set("Cookie", global.signin(userId))
//     .send({
//       token: "tok_visa",
//       orderId: order.id,
//     })
//     .expect(201);

//   const chargeOptions = (stripe.charges.create as jest.Mock).mock.calls[0][0];

//   expect(chargeOptions.source).toEqual("tok_visa");
//   expect(chargeOptions.amount).toEqual(20 * 100);
//   expect(chargeOptions.currency).toEqual("usd");

//   const payment = await Payment.findOne({ orderId: order.id });
//   expect(payment!.stripeId).toEqual("mock-stripe-id");
// });

// Realistic implementation with Stripe API
it("returns a 201 with valid inputs", async () => {
  const userId = mongoose.Types.ObjectId().toHexString();
  const price = Math.floor(Math.random() * 100000);
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    userId,
    version: 0,
    price,
    status: OrderStatus.Created,
  });
  await order.save();

  const paymentResponse = await request(app)
    .post("/api/payments")
    .set("Cookie", global.signin(userId))
    .send({
      token: "tok_visa",
      orderId: order.id,
    })
    .expect(201);

  const { id: paymentId } = paymentResponse.body;

  const payment = await Payment.findById(paymentId);
  // findById() will evaluate to a value or null
  expect(payment).not.toBeNull();

  const stripeCharges = await stripe.charges.list({ limit: 50 });
  const stripeCharge = stripeCharges.data.find((charge) => {
    return charge.id === payment!.stripeId;
  });

  // find() will evaluate to a value or to undefined
  expect(stripeCharge).toBeDefined();
  expect(stripeCharge!.currency).toEqual("usd");
});
