import mongoose from "mongoose";
import { Password } from "../services/password";

// An object that describes the properties
// that are required to create a new User
interface UserAttrs {
  email: string;
  password: string;
}

// A class that provides an interface to the database for reading,
// creating, querying, updating, deleting records, etc
interface UserModel extends mongoose.Model<UserDoc> {
  build(attrs: UserAttrs): UserDoc;
}

// A class that describes the properties of a User Document/
// database row that can be accessed when using the model in code
interface UserDoc extends mongoose.Document {
  email: string;
  password: string;
}

// An interface that defines the structure of a document, default values, validators, etc.
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    // Override the JSON representation of the serialized user model. Useful for
    // protecting sensitive information before transferring over HTTP for instance
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.password; // remove the password field
        // delete ret.__v  // Commented out because we're instead setting versionKey to false below
      },
      versionKey: false,
    },
  }
);

// Pre-save hook to hash a password if the password was updated
userSchema.pre("save", async function (done) {
  if (this.isModified("password")) {
    const hashed = await Password.toHash(this.get("password"));
    this.set("password", hashed);
  }
  done();
});

// The statics object allows us to add a new method to the model
// This custom build function allows type checking on attrs.
userSchema.statics.build = (attrs: UserAttrs) => {
  return new User(attrs);
};

// The model provides us access to the collection (database table), in code
const User = mongoose.model<UserDoc, UserModel>("User", userSchema);

export { User };
