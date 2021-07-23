import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function getAuthUser(req, res, next) {}

export async function protect(req, res, next) {
  if (!req.headers.authorization) {
    return next({
      message: "You must logged in to access this endpoint",
    });
  }

  try {
    const token = req.headers.authorization;
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
      },
      include: {
        videos: true,
      },
    });

    if (!user) {
      return next({
        message: "You must logged in to access this endpoint",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return next({
      message: "You must logged in to access this endpoint",
    });
  }
}
