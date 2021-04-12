import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

declare global {
  namespace NodeJS {
    interface Global {
      signin(id?: string): string[];
    }
  }
}

// Redirect all imports for the NATS streaming server client
// to our mock implementation of the same file name
jest.mock("../nats-wrapper.ts");

// FIXME: Don't hardcode API tokens
// We don't place this env variable in the beforeAll hook because
// it's used as soon as we load the stripe.ts file into our src directory

// Comment out line below when using 'Mock Implementation without Stripe API' test suite
process.env.STRIPE_KEY =
  "sk_test_51If4DQGmbPFPG9W4sGLaMoSx4Y43ObwrFzDvEVaI020wrLX7mysnEXeiEHggKxi0ndk6I9PJeZyDpCrZn2QOe9sO00jKjKb7RZ";

let mongo: any;

beforeAll(async () => {
  process.env.JWT_KEY = "asdfasdf";
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  mongo = new MongoMemoryServer();
  const mongoUri = await mongo.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

beforeEach(async () => {
  // Reset mock data to prevent polluting data in one test with data from a previous one
  // because the mock function internally records how many times it gets called, different
  // arguments that it's provided etc.
  jest.clearAllMocks();
  const collections = await mongoose.connection.db.collections();

  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongo.stop();
  await mongoose.connection.close();
});

// This signin function will only be available in the global testing context
global.signin = (id?: string) => {
  // Build a JWT payload.  { id, email }
  const payload = {
    id: id || new mongoose.Types.ObjectId().toHexString(),
    email: "test@test.com",
  };

  // Create the JWT!
  const token = jwt.sign(payload, process.env.JWT_KEY!);

  // Build session Object. { jwt: MY_JWT }
  const session = { jwt: token };

  // Turn that session into JSON
  const sessionJSON = JSON.stringify(session);

  // Take JSON and encode it as base64
  const base64 = Buffer.from(sessionJSON).toString("base64");

  // return a string thats the cookie with the encoded data
  return [`express:sess=${base64}`];
};
