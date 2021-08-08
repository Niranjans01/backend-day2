const { db } = require("../utils/admin");

exports.getFoods = (req, res) => {
  db.collection("foods")
    .orderBy("createdAt", "desc")
    .get()
    .then((data) => {
      let foodRes = [];
      data.forEach((doc) => {
        foodRes.push({
          name: doc.data().name,
          price: doc.data().price,
          desc: doc.data().desc,
        });
      });

      return res.json(foodRes);
    })
    .catch((err) => {
      console.log("foods access error", err);
      return res.status(500).json({ error: err });
    });
};

exports.addFood = (req, res) => {
  if (req.body.body.trim() === "") {
    return res.status(404).json({ error: "Body must not be empty" });
  }

  if (req.body.name.trim() === "") {
    return res.status(404).json({ error: "Name must not be empty" });
  }

  const formData = {
    name: req.body.name,
    desc: req.body.desc,
    price: req.body.price,
    username:req.user.username,
    createdAt: new Date().toISOString(),
  };

  db.collection("foods")
    .add(formData)
    .then((data) => {
      const reqponseAfterFood = formData;
      reqponseAfterFood.id = data.id;
      return res.json(reqponseAfterFood);
    })
    .catch((err) => {
      console.log("Error while adding food", err);
      return res.status(500).json({ error: err });
    });
};

exports.deletefood = (req, res) => {
  const doc = db.doc(`/foods/${req.params.foodId}`);
  doc
    .get()
    .then((data) => {
      if (!data.exists) {
        return res.status(404).json({ error: "Foods doesn't exist" });
      }
      return doc.delete();
    })
    .then((data) => {
      return res.json({ message: "Food Deleted Successfull" });
    })
    .catch((err) => {
      console.log("Error in deleting proocess", err);
      return res.status(500).json({ error: err });
    });
};

exports.editfood = (req, res) => {

    if (req.body.foodId || req.body.createdAt) {
      return res.status(403).json({ error: "Unable to edit" });
    }

  let doc = db.collection("foods").doc(`${req.params.foodId}`);
  doc
    .update(req.body)
    .then((data) => {
      res.json({ message: "Updated food successfully" });
    })
    .catch((err) => {
      console.log("Error in edit proocess", err);
      return res.status(500).json({ error: err });
    });
};
