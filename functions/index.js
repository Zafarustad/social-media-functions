const functions = require("firebase-functions");
const express = require("express");
const {
  getAllPosts,
  PostSpark,
  getSpark,
  addComment,
  likeSpark
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
// app.post('./spark/:sparkId/like', FBAuth, likeSpark);
// app.post('./spark/:sparkId/unlike', FBAuth, unlikeSpark);

//Auth routes
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", FBAuth, uploadImage);
app.post("/user", FBAuth, addUserDetails);
app.get("/user", FBAuth, getAuthenticatedUser);

exports.api = functions.https.onRequest(app);
