/* eslint-disable */
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
  getAuthenticatedUserDetail,
  getUserDetails,
} = require("./handlers/users");
const moment = require("moment");
const FBAuth = require("./util/FBAuth");
const { db } = require("./util/admin");

const app = express();

//Posts route
app.post("/spark", FBAuth, PostSpark);
app.get("/sparks", getAllPosts);
app.get("/spark/:sparkId", getSpark);
app.post("/spark/:sparkId/comment", FBAuth, addComment);
app.get("/spark/:sparkId/like", FBAuth, likeSpark);
app.get("/spark/:sparkId/unlike", FBAuth, unlikeSpark);
app.delete("/spark/:sparkId/delete", FBAuth, deleteSpark);

//User routes
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", FBAuth, uploadImage);
app.post("/user", FBAuth, addUserDetails);
app.get("/user", FBAuth, getAuthenticatedUserDetail);
app.get('/user/:username', getUserDetails);
// app.post('/notifications', markNotificationsRead);

exports.api = functions.https.onRequest(app);

exports.createNotificationOnLike = functions.region('us-central1').firestore
  .document("likes/{id}")
  .onCreate(snapshot => {
    db.doc(`/sparks/${snapshot.data().sparkId}`)
      .get()
      .then(doc => {
        if (doc.exists) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: moment().format(),
            recipient: doc.data().username,
            sender: snapshot.data().username,
            type: "like",
            read: false,
            sparkId: doc.id
          });
        }
      })
      .then(() => {
        return;
      })
      .catch(err => {
        console.error(err);
        return;
      });
  });

exports.deleteNotificationOnUnlike = functions.region('us-central1').firestore
  .document("likes/{id}")
  .onDelete(snapshot => {
    db.doc(`/notifications/${snapshot.id}`)
      .delete()
      .then(() => {
        return;
      })
      .catch(err => {
        console.error(err);
        return;
      });
  });

exports.createNotificationOnComment = functions.region('us-central1').firestore
  .document("comments/{id}")
  .onCreate(snapshot => {
    db.doc(`/sparks/${snapshot.data().sparkId}`)
      .get()
      .then(doc => {
        console.log('dsnjd', doc.exists)
        if (doc.exists) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: moment().format(),
            recipient: doc.data().username,
            sender: snapshot.data().username,
            type: "comment",
            read: false,
            sparkId: doc.id
          });
        }
      })
      .then(() => {
        return;
      })
      .catch(err => {
        console.error(err);
        return;
      });
  });
