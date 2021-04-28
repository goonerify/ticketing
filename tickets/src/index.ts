import mongoose from "mongoose";

import { app } from "./app";
import { natsWrapper } from "./nats-wrapper";
import { OrderCancelledListener } from "./events/listeners/order-cancelled-listener";
import { OrderCreatedListener } from "./events/listeners/order-created-listener";

const start = async () => {
  console.log("Starting up.....");
  if (!process.env.JWT_KEY) {
    console.log("no nats jwt key");
    throw new Error("JWT_KEY must be defined");
  }

  if (!process.env.MONGO_URI) {
    console.log("no nats mongo uri");
    throw new Error("MONGO_URI must be defined");
  }

  if (!process.env.NATS_CLIENT_ID) {
    console.log("no nats client id");
    throw new Error("NATS_CLIENT_ID must be defined");
  }

  if (!process.env.NATS_URL) {
    console.log("no nats url");
    throw new Error("NATS_URL must be defined");
  }

  if (!process.env.NATS_CLUSTER_ID) {
    console.log("no nats cluster id");
    throw new Error("NATS_CLUSTER_ID must be defined");
  }

  try {
    console.log("Connecting nats wrapper");
    await natsWrapper.connect(
      process.env.NATS_CLUSTER_ID,
      process.env.NATS_CLIENT_ID,
      process.env.NATS_URL
    );

    console.log("nats client close");
    natsWrapper.client.on("close", () => {
      console.log("NATS connection closed!");
      process.exit(); // exit process entirely when we lose the connection to nats
    });

    // exit process entirely when the connection is interrupted
    console.log("nats sigint");
    process.on("SIGINT", () => {
      console.log("exit on sigint");
      natsWrapper.client.close();
    });
    process.on("SIGTERM", () => {
      console.log("exit on sigterm");
      natsWrapper.client.close();
    });

    console.log("activating listeners");
    // activate listeners for incoming events
    new OrderCreatedListener(natsWrapper.client).listen();
    new OrderCancelledListener(natsWrapper.client).listen();

    console.log("connecting mongoose");
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
    console.log("Connected to MongoDB!");
  } catch (err) {
    console.error(err);
  }

  app.listen(3000, () => {
    console.log("Tickets service listening on port 3000!");
  });
};

start();
