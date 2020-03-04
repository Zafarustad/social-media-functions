const moment = require("moment");
const { db } = require("../util/admin");


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

  const newPost = {
    username: req.user.username,
    body: req.body.body,
    createdAt: moment().format()
  };

  db.collection("sparks")
    .add(newPost)
    .then(doc => {
      return res.json({ message: `spark ${doc.id} posted successfully` });
    })
    .catch(err => {
      return res.status(500).json({ error: "Internal server error" });
    });
};
