import mongoose from "mongoose";
import { Ticket } from "../ticket";

// done function is used to tell jest that testing has been completed
// this is needed in certain situations where a proper expectation cannot
// be implemented, to help jest figure out when testing has been concluded
it("implements optimistic concurrency control", async (done) => {
  // Create an instance of a ticket
  const ticket = Ticket.build({
    title: "concert",
    price: 5,
    userId: "123",
  });

  // Save the ticket to the database
  await ticket.save();

  // fetch the ticket twice
  const firstInstance = await Ticket.findById(ticket.id);
  const secondInstance = await Ticket.findById(ticket.id);

  // make two separate changes to the tickets we fetched
  firstInstance!.set({ price: 10 });
  secondInstance!.set({ price: 15 });

  // save the first fetched ticket and automatically increase the version number
  // with OCC (Optimistic Concurrency Control)
  await firstInstance!.save();

  // save the second fetched ticket with what is now an outdated version number
  // and expect an error
  try {
    await secondInstance!.save();
  } catch (err) {
    // inform jest that the test has been completed in lieu of a proper expectation
    return done();
  }

  // manually trigger a failure of this test in lieu of a proper expectation
  throw new Error("Should not reach this point");

  // Code block below doesn't work. Seems to be a jest bug
  //   expect(async () => {
  //     await secondInstance!.save();
  //   }).toThrow(mongoose.Error.VersionError);
});

it("increments the version number on multiple saves", async () => {
  const ticket = Ticket.build({
    title: "concert",
    price: 20,
    userId: "123",
  });

  await ticket.save();
  expect(ticket.version).toEqual(0);
  await ticket.save();
  expect(ticket.version).toEqual(1);
  await ticket.save();
  expect(ticket.version).toEqual(2);
});
