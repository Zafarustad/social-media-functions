const functions = require("firebase-functions");
const admin = require("firebase-admin");
const moment = require("moment");
const firebase = require("firebase");

admin.initializeApp();

const express = require("express")
const app = express();

var firebaseConfig = {
  apiKey: "AIzaSyDSZMhmqgMR3ipHT-djY45OJiG9D74lj-0",
  authDomain: "social-media-8d6da.firebaseapp.com",
  databaseURL: "https://social-media-8d6da.firebaseio.com",
  projectId: "social-media-8d6da",
  storageBucket: "social-media-8d6da.appspot.com",
  messagingSenderId: "96003977033",
  appId: "1:96003977033:web:2ba6527dc76859151bb498",
  measurementId: "G-ZWWMN040FF"
};

firebase.initializeApp(firebaseConfig);

app.get("/sparks", (req, res) => {
  admin
    .firestore()
    .collection("sparks")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      let posts = [];
      data.forEach(doc => {
        posts.push({
          postId: doc.id,
          userHandle: doc.data().userHandle,
          body: doc.data().body,
          createdAt: doc.data().createdAt
        });
      });
      return res.json(posts);
    })
    .catch(err => {
      res.status(500).json({ error: "Internal server error" });
      console.log(err);
    });
});

app.post("/spark", (req, res) => {
  const newPost = {
    username: req.body.username,
    body: req.body.body,
    createdAt: moment().format()
  };

  admin
    .firestore()
    .collection("sparks")
    .add(newPost)
    .then(doc => {
      return res.json({ message: `document ${doc.id} created successfully` });
    })
    .catch(err => {
      return res.status(500).json({ error: "Internal server error" });
    });
});

//Signup Route

app.post("/signup", (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    username: req.body.username
  };

  //validate

  firebase
    .auth()
    .createUserWithEmailAndPassword(newUser.email, newUser.password)
    .then(data => {
      return res
        .status(201)
        .json({ message: `user ${data.user.uid} signed up successfully` });
    })
    .catch(err => {
      console.error(err);
      return res
        .state(500)
        .json({ message: `Internal server error: ${err.code}` });
    });
});

exports.api = functions.https.onRequest(app);
