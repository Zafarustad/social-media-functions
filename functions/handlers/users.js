/* eslint-disable */
const firebase = require("firebase");
const moment = require("moment");
const { admin, db } = require("../util/admin");
const config = require("../util/config");
const {
  validateSignupData,
  validateLoginData,
  reduceUserDetails
} = require("../util/validators");

firebase.initializeApp(config);

//user signup
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

  const noAvatar = "no-avatar.png";

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
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noAvatar}?alt=media`,
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
      return res
        .status(500)
        .json({ general: `Something went wrong, please try again` });
    });
};

//user login
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

//add users details
exports.addUserDetails = (req, res) => {
  let userDetails = reduceUserDetails(req.body);

  db.doc(`/users/${req.user.username}`)
    .update(userDetails)
    .then(() => {
      return res.json({ message: "Details updated successfully" });
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: `Internal server error: ${err}` });
    });
};

//fetch user info
exports.getAuthenticatedUserDetail = (req, res) => {
  let userData = {};
  db.doc(`/users/${req.user.username}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        userData.credentials = doc.data();
        return db
          .collection("likes")
          .where("username", "==", req.user.username)
          .get();
      }
    })
    .then(data => {
      userData.likes = [];
      data.forEach(doc => {
        userData.likes.push(doc.data());
      });
      return db
        .collection("notifications")
        .where("recipient", "==", req.user.username)
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();
    })
    .then(data => {
      userData.notifications = [];
      data.forEach(doc => {
        userData.notifications.push({
          recipient: doc.data().recipient,
          sender: doc.data().sender,
          createdAt: doc.data().createdAt,
          sparkId: doc.data().sparkId,
          type: doc.data().type,
          read: doc.data().read,
          notificationId: doc.id
        });
      });
      return res.json(userData);
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: `Internal server error: ${err}` });
    });
};

//get any user details
exports.getUserDetails = (req, res) => {
  let userData = {};
  db.doc(`users/${req.params.username}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        userData.user = doc.data();
        return db
          .collection("sparks")
          .where("username", "==", req.params.username)
          .orderBy("createdAt", "desc")
          .get();
      }
      return res.status(404).json({ error: "User not found" });
    })
    .then(data => {
      userData.sparks = [];
      data.forEach(doc => {
        userData.sparks.push({
          body: doc.data().body,
          createdAt: doc.data().createdAt,
          username: doc.data().username,
          userImage: doc.data().userImage,
          likeCount: doc.data().likeCount,
          commentCount: doc.data().commentCount,
          sparkId: doc.id
        });
      });
      return res.json(userData);
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: `Internal server error: ${err}` });
    });
};

exports.markNotificationsRead = (req, res) => {
  let batch = db.batch();
  req.body.forEach(notificationId => {
    const notification = db.doc(`/notifications/${notificationId}`);
    batch.update(notification, { read: true });
  });
  batch
    .commit()
    .then(() => {
      return res.json({ message: "Notification marked read" });
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: `Internal server error: ${err}` });
    });
};

//update user profile pic
exports.uploadImage = (req, res) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({ headers: req.headers });

  let imgFilename;
  let imgToBeUploaded = {};
  let img;

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({ error: "Wrong filetype submitted" });
    }

    const imgExtension = filename.split(".")[filename.split(".").length - 1];
    imgFilename = `${Math.round(Math.random() * 1000000)}.${imgExtension}`;
    const filePath = path.join(os.tmpdir(), imgFilename);
    imgToBeUploaded = { filePath, mimetype };
    file.pipe(fs.createWriteStream(filePath));
  });
  busboy.on("finish", () => {
    admin
      .storage()
      .bucket()
      .upload(imgToBeUploaded.filePath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imgToBeUploaded.mimetype
          }
        }
      })
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imgFilename}?alt=media`;
        img = imageUrl;
        console.log("shdvsgvds", img);
        return db.doc(`/users/${req.user.username}`).update({ imageUrl });
      })
      .then(() => {
        return res.json({ message: "Image uploaded successfully" });
      })
      .catch(err => {
        console.error(err);
        return res.status(500).json({ error: `Internal server error: ${err}` });
      });
  });
  busboy.end(req.rawBody);
};

//Fetch Messages
exports.fetchMessages = (req, res) => {
  db.collection("messages")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      let messages = [];
      data.forEach(doc => {
        messages.push({
          body: doc.data().body,
          createdAt: doc.data().createdAt,
          username: doc.data().username,
          userImage: doc.data().userImage
        });
      });
      return res.json(messages);
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: `Internal server error: ${err}` });
    });
};


//Send Message
exports.sendMessage = (req, res) => {
  if (req.body.body.trim() === "") {
    return res.status(400).json({ body: "must not be empty" });
  }

  const newMessage = {
    username: req.user.username,
    body: req.body.body,
    createdAt: moment().format(),
    userImage: req.user.imageUrl
  };

  db.collection("messages")
    .add(newMessage)
    .then(doc => {
      const resMssg = newMessage;
      resMssg.messageId = doc.id;
      return res.json(newMessage);
    })
    .catch(err => {
      return res.status(500).json({ error: `Internal server error: ${err}` });
    });
};
