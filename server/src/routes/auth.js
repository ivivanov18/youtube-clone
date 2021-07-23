import express from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

// A function to get the routes.
// All route definitions are in one place and we only need to export one thing
function getAuthRoutes() {
  const router = express.Router();

  router.post("/google-login", googleLogin);

  return router;
}

// All controllers/utility functions here
async function googleLogin(req, res) {
  const { email, username } = req.body;

  let user = await prisma.user.findUnique({
    where: { email },
  });
  console.log("1", user);

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        username,
      },
    });
    console.log({ user });
  }

  const tokenPayload = { id: (await user).id };
  const token = await jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  res.cookie("token", token, { httpOnly: true });
  res.status(200).send(token);
}

async function me(req, res) {}

function signout(req, res) {}

export { getAuthRoutes };
