const moment = require("moment");
const { db } = require("../util/admin");

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
      res.status(500).json({ error: "Internal server error" });
      console.log(err);
    });
};

exports.PostSpark = (req, res) => {
  if (req.body.body.trim() === "") {
    return res.status(400).json({ body: "Body must not be empty" });
  }

  console.log(req.body.body);

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
