import Queue from "bull";
import { ExpirationCompletePublisher } from "../events/publishers/expiration-complete-publisher";
import { natsWrapper } from "../nats-wrapper";

// An interface describing the data that will be stored in this job
interface Payload {
  orderId: string;
}

// order:expiration is the channel in redis where we want to save this new job
const expirationQueue = new Queue<Payload>("order:expiration", {
  redis: {
    host: process.env.REDIS_HOST,
  },
});

// Process the job when redis server returns it after elapsed time (15 minutes in this case)
expirationQueue.process(async (job) => {
  new ExpirationCompletePublisher(natsWrapper.client).publish({
    orderId: job.data.orderId, // Data property contains all information we store in the job
  });
});

export { expirationQueue };
