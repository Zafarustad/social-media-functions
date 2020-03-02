const firebase = require("firebase");
const moment = require("moment");
const { db } = require("../util/admin");
const config = require("../util/config");
const { validateSignupData, validateLoginData } = require("../util/validators");

firebase.initializeApp(config);

exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    username: req.body.username
  };

  const { errors, valid } = validateSignupData(newUser);

  if (!valid) {
    return res.status(400).json(errors);
  }

  let accessToken;
  let userId;

  db.doc(`/users/${newUser.username}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({ username: "This username is taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(token => {
      accessToken = token;
      const userCredentials = {
        username: newUser.username,
        email: newUser.email,
        createdAt: moment().format(),
        userId: userId
      };
      return db.doc(`users/${newUser.username}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ accessToken });
    })
    .catch(err => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ email: "Email already in use" });
      }
      return res.status(500).json({ message: `Internal server error: ${err}` });
    });
};

exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  };

  const { errors, valid } = validateLoginData(user);

  if (!valid) {
    return res.status(400).json(errors);
  }
  
  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return res.json({ token });
    })
    .catch(err => {
      console.error(err);
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        return res
          .status(403)
          .json({ general: "Wrong credentials, please try again" });
      }
      return res
        .status(500)
        .json({ error: `Internal sserve error: ${err.code}` });
    });
};
