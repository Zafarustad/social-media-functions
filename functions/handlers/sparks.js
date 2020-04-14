/* eslint-disable */
const moment = require('moment');
const { db, admin } = require('../util/admin');
const { validatePostSpark } = require('../util/validators');

//fetch all posts
exports.getAllPosts = (req, res) => {
  db.collection('sparks')
    .orderBy('createdAt', 'desc')
    .get()
    .then((data) => {
      let posts = [];
      data.forEach((doc) => {
        posts.push({
          sparkId: doc.id,
          username: doc.data().username,
          body: doc.data().body,
          createdAt: doc.data().createdAt,
          commentCount: doc.data().commentCount,
          likeCount: doc.data().likeCount,
          userImage: doc.data().userImage,
        });
      });
      return res.json(posts);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    });
};

//add a new spark
exports.PostSpark = (req, res) => {
  if (req.body.body.trim() === '') {
    return res.status(400).json({ body: 'Must not be empty' });
  }

  const newSpark = {
    username: req.user.username,
    body: req.body.body,
    createdAt: moment().format(),
    userImage: req.user.imageUrl,
    likeCount: 0,
    commentCount: 0,
  };

  const { errors, valid } = validatePostSpark(newSpark.body);
  if (!valid) {
    return res.status(400).json(errors);
  }

  db.collection('sparks')
    .add(newSpark)
    .then((doc) => {
      const resSpark = newSpark;
      resSpark.sparkId = doc.id;
      return res.json(newSpark);
    })
    .catch((err) => {
      return res.status(500).json({ error: `Internal server error: ${err}` });
    });
};

//fetch spark data
exports.getSpark = (req, res) => {
  let sparkData = {};

  db.doc(`/sparks/${req.params.sparkId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Spark not found' });
      }
      sparkData = doc.data();
      sparkData.sparkId = doc.id;
      return db
        .collection('comments')
        .orderBy('createdAt', 'desc')
        .where('sparkId', '==', req.params.sparkId)
        .get();
    })
    .then((data) => {
      sparkData.comments = [];
      data.forEach((doc) => {
        sparkData.comments.push(doc.data());
      });
      return res.json(sparkData);
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: `Internal sever error: ${err}` });
    });
};

//add comment to a spark
exports.addComment = (req, res) => {
  const newComment = {
    body: req.body.body,
    createdAt: moment().format(),
    sparkId: req.params.sparkId,
    username: req.user.username,
    userImage: req.user.imageUrl,
  };

  if (req.body.body.trim() === '')
    return res.status(400).json({ comment: 'Must not be empty' });

  db.doc(`/sparks/${req.params.sparkId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Spark not found' });
      }
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
    })
    .then(() => {
      return db.collection('comments').add(newComment);
    })
    .then(() => {
      return res.json(newComment);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: `Internal server error: ${err}` });
    });
};

//like a spark
exports.likeSpark = (req, res) => {
  const likeDocument = db
    .collection('likes')
    .where('username', '==', req.user.username)
    .where('sparkId', '==', req.params.sparkId)
    .limit(1);

  const SparkDocument = db.doc(`/sparks/${req.params.sparkId}`);

  let sparkData = {};

  SparkDocument.get()
    .then((doc) => {
      if (doc.exists) {
        sparkData = doc.data();
        sparkData.sparkId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: 'Spark not found' });
      }
    })
    .then((data) => {
      if (data.empty) {
        return db
          .collection('likes')
          .add({
            sparkId: req.params.sparkId,
            username: req.user.username,
          })
          .then(() => {
            sparkData.likeCount++;
            return SparkDocument.update({ likeCount: sparkData.likeCount });
          })
          .then(() => {
            return res.json(sparkData);
          });
      } else {
        return res.status(400).json({ error: 'Spark already liked' });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: `Internal server error: ${err}` });
    });
};

//unlike a spark
exports.unlikeSpark = (req, res) => {
  const likeDocument = db
    .collection('likes')
    .where('username', '==', req.user.username)
    .where('sparkId', '==', req.params.sparkId)
    .limit(1);

  const SparkDocument = db.doc(`/sparks/${req.params.sparkId}`);

  let sparkData = {};

  SparkDocument.get()
    .then((doc) => {
      if (doc.exists) {
        sparkData = doc.data();
        sparkData.sparkId = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: 'Spark not found' });
      }
    })
    .then((data) => {
      if (data.empty) {
        return res.status(400).json({ error: 'Spark not liked' });
      } else {
        db.doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            sparkData.likeCount--;
            return SparkDocument.update({ likeCount: sparkData.likeCount });
          })
          .then(() => {
            return res.json(sparkData);
          })
          .catch(() => {
            //no error handling
          });
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: `Internal server error: ${err}` });
    });
};

//Delete spark
exports.deleteSpark = (req, res) => {
  const document = db.doc(`sparks/${req.params.sparkId}`);

  document
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Spark not found' });
      }
      if (doc.data().username !== req.user.username) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      return document.delete();
    })
    .then(() => {
      return res.json({ message: 'Spark deleted successfully' });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: `Internal server error: ${err}` });
    });
};

//get sparks of following users
exports.getfollowingSparks = (req, res) => {
  const userDocument = db.doc(`/users/${req.user.username}`);

  let userData = {};
  let followingUsers = [];

  userDocument
    .get()
    .then((doc) => {
      if (doc.exists) {
        userData = doc.data();
        userData.following.forEach((user) => {
          followingUsers.push(user.username);
        });
        return db.collection('sparks').get();
      } else {
        return res.status(404).json({ error: 'user not found' });
      }
    })
    .then((data) => {
      let sparks = [];
      data.forEach((doc) => {
        sparks.push({
          sparkId: doc.id,
          username: doc.data().username,
          body: doc.data().body,
          createdAt: doc.data().createdAt,
          commentCount: doc.data().commentCount,
          likeCount: doc.data().likeCount,
          userImage: doc.data().userImage,
        });
      });
      let filteredSparks = [];
      let result = [];
      for (let i = 0; i < followingUsers.length; i++) {
        result = sparks.filter((spark) => spark.username === followingUsers[i]);
        filteredSparks.push(...result);
      }
      return res.json(filteredSparks);
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: `Internal sever error: ${err}` });
    });
};
