import mongoose from "mongoose";
import { updateIfCurrentPlugin } from "mongoose-update-if-current";

// Properties used to create a ticket
interface TicketAttrs {
  title: string;
  price: number;
  userId: string;
}

// A class that describes the properties of a Ticket Document/
// database row that can be accessed when using the model in code
interface TicketDoc extends mongoose.Document {
  title: string;
  price: number;
  userId: string;
  version: number;
  // We use the orderId as both a flag to prevent editing a ticket that
  // has been reserved, and also as a means to locate the order to provide
  // more information about the order status to the seller of the ticket

  // Note: Instead of reaching out to the order service with the orderId,
  // we could create a new endpoint to make a request to the order service
  // with the ticketId instead, which is already available in the orders database
  // ticket field and can be used to facilitate a search for the appropriate
  // order to return its status to the client
  orderId?: string;
}

// A class that provides an interface to the database for reading,
// creating, querying, updating, deleting records, etc
interface TicketModel extends mongoose.Model<TicketDoc> {
  build(attrs: TicketAttrs): TicketDoc;
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
    },
    userId: {
      type: String,
      required: true,
    },
    orderId: {
      // not required because there's no associated orderId
      // the first time a ticket is created
      type: String,
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

// The statics object allows us to add a new method to the model
ticketSchema.statics.build = (attrs: TicketAttrs) => {
  return new Ticket(attrs);
};

// The model provides us access to the collection (database table), in code
const Ticket = mongoose.model<TicketDoc, TicketModel>("Ticket", ticketSchema);

export { Ticket };
