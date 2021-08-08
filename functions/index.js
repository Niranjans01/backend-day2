const functions = require("firebase-functions");
const app = require("express")();
app.use((req, res, next)=>{
    res.header("Access-Control-Allow-Origin", "http://localhost:3000"); // update to match the domain you will make the request from
    res.header(
      "Access-Control-Allow-Headers",
      "*",
    );
    res.header(
      "Access-Control-Allow-Methods",
      "*",
    );
    next();
})
const { getFoods, addFood, deletefood, editfood } = require("./apis/foods");
const { loginUser, registerUser, uploadProfileImage } = require("./apis/users");
const auth = require("./utils/auth");

//Foods
app.get("/", getFoods);
app.post("/addfood", auth, addFood);
app.put("/editfood/:foodId", auth, editfood);
app.delete("/deletefood/:foodId", auth, deletefood);

//User
app.post("/login", loginUser);
app.post("/signup", registerUser);
app.post("/imageUpload", auth, uploadProfileImage);

exports.api = functions.https.onRequest(app);
