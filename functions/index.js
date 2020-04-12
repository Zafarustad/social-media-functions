/* eslint-disable */
const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const {
  getAllPosts,
  PostSpark,
  getSpark,
  addComment,
  likeSpark,
  unlikeSpark,
  deleteSpark,
  getfollowingSparks
} = require('./handlers/sparks');
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUserDetail,
  getUserDetails,
  markNotificationsRead,
  fetchMessages,
  sendMessage,
  followUser,
  unfollowUser,
} = require('./handlers/users');
const moment = require('moment');
const FBAuth = require('./util/FBAuth');
const { db } = require('./util/admin');

const app = express();
app.use(cors());

//Spark routes
app.post('/spark', FBAuth, PostSpark);
app.get('/sparks', getAllPosts);
app.get('/spark/:sparkId', getSpark);
app.post('/spark/:sparkId/comment', FBAuth, addComment);
app.get('/spark/:sparkId/like', FBAuth, likeSpark);
app.get('/spark/:sparkId/unlike', FBAuth, unlikeSpark);
app.delete('/spark/:sparkId/delete', FBAuth, deleteSpark);
app.get('/following/sparks', FBAuth, getfollowingSparks)

//User routes
app.post('/signup', signup);
app.post('/login', login);
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUserDetail);
app.get('/user/:username', getUserDetails);
app.post('/notifications', markNotificationsRead);
app.get('/user/:username/follow', FBAuth, followUser);
app.get('/user/:username/unfollow', FBAuth, unfollowUser);
app.get('/messages', fetchMessages);
app.post('/message', FBAuth, sendMessage);

exports.api = functions.https.onRequest(app);

exports.createNotificationOnLike = functions
  .region('us-central1')
  .firestore.document('likes/{id}')
  .onCreate((snapshot) => {
    db.doc(`/sparks/${snapshot.data().sparkId}`)
      .get()
      .then((doc) => {
        if (doc.exists && doc.data().username !== snapshot.data().username) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: moment().format(),
            recipient: doc.data().username,
            sender: snapshot.data().username,
            type: 'like',
            read: false,
            sparkId: doc.id,
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  });

exports.deleteNotificationOnUnlike = functions
  .region('us-central1')
  .firestore.document('likes/{id}')
  .onDelete((snapshot) => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.createNotificationOnComment = functions
  .region('us-central1')
  .firestore.document('comments/{id}')
  .onCreate((snapshot) => {
    return db
      .doc(`/sparks/${snapshot.data().sparkId}`)
      .get()
      .then((doc) => {
        if (doc.exists && doc.data().username !== snapshot.data().username) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: moment().format(),
            recipient: doc.data().username,
            sender: snapshot.data().username,
            type: 'comment',
            read: false,
            sparkId: doc.id,
          });
        }
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });

exports.onUserImageChange = functions
  .region('us-central1')
  .firestore.document('users/{userId}')
  .onUpdate((change) => {
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      let batch = db.batch();
      return db
        .collection('sparks')
        .where('username', '==', change.before.data().username)
        .get()
        .then((data) => {
          data.forEach((doc) => {
            const spark = db.doc(`/sparks/${doc.id}`);
            batch.update(spark, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    } else return true;
  });

exports.onScreamDelete = functions
  .region('us-central1')
  .firestore.document('/sparks/{sparkId}')
  .onDelete((snapshot, context) => {
    const sparkId = context.params.sparkId;
    const batch = db.batch();
    return db
      .collection('comments')
      .where('sparkId', '==', sparkId)
      .get()
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db.collection('likes').where('sparkId', '==', sparkId).get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db
          .collection('notifications')
          .where('sparkId', '==', sparkId)
          .get();
      })
      .then((data) => {
        data.forEach((doc) => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch((err) => console.error(err));
  });
