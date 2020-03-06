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
    comemntCount: 0
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

  db.doc(`/spark/${req.params.sparkId}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res.status(404).json({ error: "Spark not found" });
      }
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
