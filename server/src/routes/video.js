import { PrismaClient } from "@prisma/client";
import express from "express";
import { protect } from "../middleware/authorization";

const prisma = new PrismaClient();

function getVideoRoutes() {
  const router = express.Router();
  router.get("/", getRecommendedVideos);
  router.get("/trending", getTrendingVideos);
  router.get("/search", searchVideos);
  router.post("/", protect, addVideo);

  return router;
}

async function getRecommendedVideos(req, res) {
  let videos = await prisma.video.findMany({
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!videos.length) {
    return res.status(200).json({ videos });
  }

  videos = await getVideoViews(videos);

  return res.status(200).json({ videos });
}

async function getTrendingVideos(req, res) {
  let videos = await prisma.video.findMany({
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!videos.length) {
    return res.status(200).json({ videos });
  }

  videos = await getVideoViews(videos);
  videos.sort((a, b) => b.views - a.views);
  return res.status(200).json({ videos });
}

async function searchVideos(req, res, next) {
  if (!req.query.query) {
    return next({
      message: "Please provide a query string",
      statusCode: 400,
    });
  }

  let videos = await prisma.video.findMany({
    include: {
      user: true,
    },
    where: {
      OR: [
        {
          title: {
            contains: req.query.query,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: req.query.query,
            mode: "insensitive",
          },
        },
      ],
    },
  });

  if (!videos.length) {
    return res.status(200).json({ videos });
  }

  videos = await getVideoViews(videos);

  return res.status(200).json({ videos });
}

async function addVideo(req, res, next) {
  const { title, description, url, thumbnail } = req.body;

  if (!title || !url || !thumbnail) {
    return next({
      message: "Please fill the required fields",
      statusCode: 400,
    });
  }

  const video = await prisma.video.create({
    data: {
      title,
      description,
      url,
      thumbnail,
      user: {
        connect: {
          id: req.user.id,
        },
      },
    },
  });

  return res.status(201).json({ video });
}

async function addComment(req, res, next) {}

async function deleteComment(req, res) {}

async function addVideoView(req, res, next) {}

async function likeVideo(req, res, next) {}

async function dislikeVideo(req, res, next) {}

async function getVideo(req, res, next) {}

async function deleteVideo(req, res) {}

async function getVideoViews(videos) {
  for (let video of videos) {
    const views = await prisma.view.count({
      where: {
        videoId: {
          equals: video.id,
        },
      },
    });
    video.views = views;
  }
  return videos;
}

export { getVideoRoutes };
