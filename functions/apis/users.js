const { admin, db } = require("../utils/admin");
const config = require("../utils/config");

const firebase = require("firebase");

firebase.initializeApp(config);

exports.loginUser = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password,
  };

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then((data) => {
      return data.user.getIdToken();
    })
    .then((token) => {
      return res.json({ token });
    })
    .catch((err) => {
      console.log(err);
      return res.status(403).json({ error: "You entered worong credentials" });
    });
};

exports.registerUser = (req, res) => {
  const addUser = {
    email: req.body.email,
    password: req.body.password,
    confirmpassword: req.body.confirmpassword,
    username: req.body.username,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
  };

  let userId, token;

  db.doc(`users/${addUser.username}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return res
          .status(400)
          .json({ error: "This username is already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(addUser.email, addUser.password);
      }
    })
    .then((data) => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((idtoken) => {
      token = idtoken;
      const userData = {
        email: addUser.email,
        username: addUser.username,
        firstname: addUser.firstname,
        lastname: addUser.lastname,
        createdAt: new Date().toISOString(),
        userId,
      };

      return db.doc(`/users/${addUser.username}`).set(userData);
    })
    .then((data) => {
      return res.status(201).json({ token });
    })
    .catch((err) => {
      console.log("Unable to signup", err);
    });
};

const deleteThisImage = (res) => {
  const bucket = admin.storage().bucket();
  const path = `${res}`;
  return bucket
    .file(path)
    .delete()
    .then(() => {
      return;
    })
    .catch((err) => {
      return;
    });
};

exports.uploadProfileImage = (req, res) => {
  const Busboy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");
  const busboy = new Busboy({ headers: req.headers });

  let imageName;
  let imageToBeUploaded = {};

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    if (mimetype !== "image/png" && mimetype !== "image/jpeg") {
      return res.status(400).json({ error: "Unsupported file format" });
    }
    const imageExtension = filename.split(".")[filename.split(".").length - 1];
    imageName = `${req.user.username}.${imageExtension}`;
    const filePath = path.join(os.tmpdir(), imageName);
    imageToBeUploaded = { filePath, mimetype };
    file.pipe(fs.createWriteStream(filePath));
  });
  deleteThisImage(imageName);

  busboy.on("finish", () => {
    admin
      .storage()
      .bucket()
      .upload(imageToBeUploaded.filePath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype,
          },
        },
      })
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageName}?alt=media`;
        return db.doc(`/users/${req.user.username}`).update({ imageUrl });
      })
      .then((data) => {
        return res.json({ message: "Image Uploaded Succesfully" });
      })
      .catch((err) => {
        console.log(err);
        return res.status(500).json({ error: err });
      });
  });

  busboy.end(req.rawBody);
};
