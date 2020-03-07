const functions = require("firebase-functions");
const express = require("express");
const {
  getAllPosts,
  PostSpark,
  getSpark,
  addComment,
  likeSpark,
  unlikeSpark,
  deleteSpark
} = require("./handlers/sparks");
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser
} = require("./handlers/auth");
const FBAuth = require("./util/FBAuth");

const app = express();

//Posts route
app.post("/spark", FBAuth, PostSpark);
app.get("/sparks", getAllPosts);
app.get("/spark/:sparkId", getSpark);
app.post("/spark/:sparkId/comment", FBAuth, addComment);
app.get("/spark/:sparkId/like", FBAuth, likeSpark);
app.get("/spark/:sparkId/unlike", FBAuth, unlikeSpark);
app.delete("/spark/:sparkId/delete", FBAuth, deleteSpark);

//Auth routes
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", FBAuth, uploadImage);
app.post("/user", FBAuth, addUserDetails);
app.get("/user", FBAuth, getAuthenticatedUser);

exports.api = functions.https.onRequest(app);
