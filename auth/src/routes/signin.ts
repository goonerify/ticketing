import express, { Request, Response } from "express";
import { body } from "express-validator";
import jwt from "jsonwebtoken";

import { Password } from "../services/password";
import { BadRequestError, validateRequest } from "@oldledger/common";
import { User } from "../models/user";

const router = express.Router();

router.post(
  "/api/users/signin",
  [
    body("email").isEmail().withMessage("Email must be valid"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("You must supply a password"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Failed Authentication Strategy: We should send as little information as possible
    // when handling failed authentication because this information could be delivered
    // to a malicious user. For instance, we should not throw a 404 not found error if a
    // user doesn't exist in our database. In this case, we should just throw a generic
    // 400 bad request error with a generic message of "Invalid Credentials" instead
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      throw new BadRequestError("Invalid credentials");
    }

    const passwordsMatch = await Password.compare(
      existingUser.password,
      password
    );
    if (!passwordsMatch) {
      throw new BadRequestError("Invalid Credentials");
    }

    // Generate JWT
    const userJwt = jwt.sign(
      {
        id: existingUser.id,
        email: existingUser.email,
      },
      process.env.JWT_KEY!
    );

    // Set the jwt on a cookie-session object
    // Prevent typescript from complaining about req.session being undefined
    req.session!.jwt = userJwt;

    res.status(200).send(existingUser);
  }
);

export { router as signinRouter };
