const { admin, db } = require("../utils/admin");

module.exports = (req, res, next) => {
  let tokenId;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    tokenId = req.headers.authorization.split("Bearer ")[1];
  } else {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  admin
    .auth()
    .verifyIdToken(tokenId)
    .then((decodedData) => {
      req.user = decodedData;
      return db
        .collection("users")
        .where("userId", "==", req.user.uid)
        .limit(1)
        .get();
    })
    .then((data) => {
      req.user.username = data.docs[0].data().username;
      req.user.imageUrl = data.docs[0].data().imageUrl;
      return next();
    });
};
