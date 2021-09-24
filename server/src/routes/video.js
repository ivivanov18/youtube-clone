import { PrismaClient } from "@prisma/client";
import express from "express";
import { getAuthUser, protect } from "../middleware/authorization";

const prisma = new PrismaClient();

function getVideoRoutes() {
  const router = express.Router();
  router.get("/", getRecommendedVideos);
  router.get("/trending", getTrendingVideos);
  router.get("/search", searchVideos);
  router.post("/", protect, addVideo);
  router.get("/:videoId/view", getAuthUser, addVideoView);
  router.post("/:videoId/comments", protect, addComment);
  router.delete("/comments/:commentId", protect, deleteComment);

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

async function addComment(req, res, next) {
  const { videoId } = req.params;
  const video = await prisma.video.findUnique({
    where: {
      id: videoId,
    },
  });

  if (!video) {
    return next({
      message: `Video with id ${videoId} was not found`,
      statusCode: 404,
    });
  }

  const { text } = req.body;

  try {
    const comment = await prisma.comment.create({
      data: {
        text,
        user: {
          connect: {
            id: req.user.id,
          },
        },
        video: {
          connect: {
            id: videoId,
          },
        },
      },
    });
    return res.status(201).json({ comment });
  } catch (err) {
    return next({
      message: "Something went wrong. Please try again",
      statusCode: 500,
    });
  }
}

async function deleteComment(req, res) {
  const { commentId } = req.params;
  const comment = await prisma.comment.findUnique({
    where: {
      id: commentId,
    },
    select: {
      userId: true,
    },
  });

  if (!comment) {
    return res.status(404).send(`Comment id ${commentId} cannot be found`);
  }

  if (comment.userId != req.user.id) {
    return res
      .status(401)
      .send("You are not authorized to delete this comment");
  }

  await prisma.comment.delete({
    where: {
      id: commentId,
    },
  });

  return res.status(200).json({});
}

async function addVideoView(req, res, next) {
  const video = await prisma.video.findUnique({
    where: {
      id: req.params.videoId,
    },
  });

  if (!video) {
    return next({
      message: `Video with id ${videoId} was not found`,
      statusCode: 404,
    });
  }

  if (req.user) {
    await prisma.view.create({
      data: {
        video: {
          connect: {
            id: req.params.videoId,
          },
        },
        user: {
          connect: {
            id: req.user.id,
          },
        },
      },
    });
  } else {
    await prisma.view.create({
      data: {
        video: {
          connect: {
            id: req.params.videoId,
          },
        },
      },
    });
  }
  return res.status(201).json({});
}

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
