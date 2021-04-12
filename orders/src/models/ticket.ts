import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";
import { OrderStatus } from "@oldledger/common";
import { Order } from "./order";

// Properties used to create a ticket
interface TicketAttrs {
  id: string; // Assign consistent ID from ticket service document
  title: string;
  price: number;
}

// A class that describes the properties of a Ticket Document/
// database row that can be accessed when using the model in code
export interface TicketDoc extends mongoose.Document {
  title: string;
  price: number;
  version: number;
  isReserved(): Promise<boolean>;
}

// A class that provides an interface to the database for reading,
// creating, querying, updating, deleting records, etc
interface TicketModel extends mongoose.Model<TicketDoc> {
  build(attrs: TicketAttrs): TicketDoc;
  findByEvent(event: {
    id: string;
    version: number;
  }): Promise<TicketDoc | null>;
}

// An interface that defines the structure of a document, default values, validators, etc.
const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    // Override the JSON representation of the serialized user model. Useful for
    // protecting sensitive information before transferring over HTTP for instance
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
      },
    },
  }
);

// use a version field as version key instead of the default __v field
ticketSchema.set("versionKey", "version");
ticketSchema.plugin(updateIfCurrentPlugin);

ticketSchema.statics.findByEvent = (event: { id: string; version: number }) => {
  return Ticket.findOne({
    _id: event.id,
    version: event.version - 1,
  });
};

// The statics object allows us to add new methods to the model
// while the methods object allows us to add new methods to Documents
// retrieved from the database
ticketSchema.statics.build = (attrs: TicketAttrs) => {
  return new Ticket({
    _id: attrs.id,
    title: attrs.title,
    price: attrs.price,
  });
};

// The methods object allows us to add a new method to a document
// Must use a function declaration, not an arrow function because
// this === the ticket document that we just called 'isReserved' on
// within this function. An arrow function would modify the value of
// this inside of the function
ticketSchema.methods.isReserved = async function () {
  // Run query to look at all orders. Find an order where the ticket
  // is the ticket we just found *and* the orders status is *not* cancelled.
  // If we find an order from that means the ticket *is* reserved, otherwise
  // the value will be null. Return the boolean representation of the query result
  const existingOrder = await Order.findOne({
    ticket: this as TicketDoc,
    status: {
      $in: [
        OrderStatus.Created,
        OrderStatus.AwaitingPayment,
        OrderStatus.Complete,
      ],
    },
  });

  return !!existingOrder;
};

// The model provides us access to the collection (database table), in code
const Ticket = mongoose.model<TicketDoc, TicketModel>("Ticket", ticketSchema);

export { Ticket };
