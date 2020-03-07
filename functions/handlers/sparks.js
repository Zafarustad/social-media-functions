const moment = require("moment");
const { db, admin } = require("../util/admin");

//fetch all posts
exports.getAllPosts = (req, res) => {
  db.collection("sparks")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      let posts = [];
      data.forEach(doc => {
        posts.push({
          sparkId: doc.id,
          username: doc.data().username,
          body: doc.data().body,
          createdAt: doc.data().createdAt
        });
      });
      return res.json(posts);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    });
};

//add a new post
exports.PostSpark = (req, res) => {
  if (req.body.body.trim() === "") {
    return res.status(400).json({ body: "Body must not be empty" });
  }

  const newSpark = {
    username: req.user.username,
    body: req.body.body,
    createdAt: moment().format(),
    userImage: req.user.imageUrl,
    likeCount: 0,
    commentCount: 0
  };

  db.collection("sparks")
    .add(newSpark)
    .then(doc => {
      const resSpark = newSpark;
      resSpark.sparkId = doc.id;
      return res.json(newSpark);
    })
    .catch(err => {
      return res.status(500).json({ error: "Internal server error" });
    });
};

//fetch spark data
exports.getSpark = (req, res) => {
  let sparkData = {};

  db.doc(`/sparks/${req.params.sparkId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Spark not found" });
      }
      sparkData = doc.data();
      sparkData.sparkId = doc.id;
      return db
        .collection("comments")
        .orderBy("createdAt", "desc")
        .where("sparkId", "==", req.params.sparkId)
        .get();
    })
    .then(data => {
      sparkData.comments = [];
      data.forEach(doc => {
        sparkData.comments.push(doc.data());
      });
      return res.json(sparkData);
    })
    .catch(err => {
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
    userImage: req.user.imageUrl
  };

  if (req.body.body.trim() === "")
    return res.status(400).json({ error: "Must not be empty" });

  db.doc(`/sparks/${req.params.sparkId}`)
    .get()
    .then(doc => {
      console.log("byshd", doc.exists);

      if (!doc.exists) {
        return res.status(404).json({ error: "Spark not found" });
      }
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
    })
    .then(() => {
      return db.collection("comments").add(newComment);
    })
    .then(() => {
      res.json(newComment);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: `Internal server error: ${err}` });
    });
};

//like a spark
exports.likeSpark = (req, res) => {
  const likeDocument = db
    .collection("likes")
    .where("username", "==", req.user.username)
    .where("sparkId", "==", req.params.sparkId)
    .limit(1);

  const SparkDocument = db.doc(`/sparks/${req.params.sparkId}`);

  let sparkData = {};

  SparkDocument.get()
    .then(doc => {
      if (doc.exists) {
        sparkData = doc.data();
        sparkData.id = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: "Spark not found" });
      }
    })
    .then(data => {
      if (data.empty) {
        return db
          .collection("likes")
          .add({
            sparkId: req.params.sparkId,
            username: req.user.username
          })
          .then(() => {
            sparkData.likeCount++;
            return SparkDocument.update({ likeCount: sparkData.likeCount });
          })
          .then(() => {
            return res.json({ sparkData });
          });
      } else {
        return res.status(400).json({ error: "Spark already liked" });
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: `Internal server error: ${err}` });
    });
};

//unlike a spark
exports.unlikeSpark = (req, res) => {
  const likeDocument = db
    .collection("likes")
    .where("username", "==", req.user.username)
    .where("sparkId", "==", req.params.sparkId)
    .limit(1);

  const SparkDocument = db.doc(`/sparks/${req.params.sparkId}`);

  let sparkData = {};

  SparkDocument.get()
    .then(doc => {
      if (doc.exists) {
        sparkData = doc.data();
        sparkData.id = doc.id;
        return likeDocument.get();
      } else {
        return res.status(404).json({ error: "Spark not found" });
      }
    })
    .then(data => {
      if (data.empty) {
        return res.status(400).json({ error: "Spark not liked" });
      } else {
        db.doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            sparkData.likeCount--;
            return SparkDocument.update({ likeCount: sparkData.likeCount });
          })
          .then(() => {
            res.json(sparkData);
          });
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: `Internal server error: ${err}` });
    });
};

exports.deleteSpark = (req, res) => {
  const document = db.doc(`sparks/${req.params.sparkId}`);

  document
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Spark not found" });
      }
      if (doc.data().username !== req.user.username) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      return document.delete();
    })
    .then(() => {
      return res.json({ message: "Spark deleted successfully" });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: `Internal server error: ${err}` });
    });
};
