const functions = require("firebase-functions");
const express = require("express");
const { getAllPosts, PostSpark } = require("./handlers/sparks");
const { signup, login, uploadImage } = require("./handlers/auth");
const FBAuth = require("./util/FBAuth");

const app = express();

//Posts route
app.post("/spark", FBAuth, PostSpark);
app.get("/sparks", getAllPosts);

//Auth routes
app.post("/signup", signup);
app.post("/login", login);
app.post('/user/image', FBAuth, uploadImage)

exports.api = functions.https.onRequest(app);
