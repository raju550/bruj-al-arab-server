const express = require("express");
const bodyPaser = require("body-parser");
const cors = require("cors");
const app = express();
require("dotenv").config();

const port = 5000;
app.use(cors());
app.use(bodyPaser.json());
var admin = require("firebase-admin");

const serviceAccount = require("./configs/burj-al-arab-5616a-firebase-adminsdk-kkb15-1e55760904.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const { MongoClient } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5sjyg.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  // @ts-ignore
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const booking = client.db("burjAlArab").collection("booking");
  app.post("/addBooking", (req, res) => {
    console.log(req.body);
    const newBooking = req.body;
    booking.insertOne(newBooking).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });
  app.get("/booking", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;

          if (tokenEmail == queryEmail) {
            booking.find({ email: queryEmail }).toArray((err, documents) => {
              res.status(200).send(documents);
            });
          } else {
            res.status(401).send("un authorized access");
          }
        })
        .catch((error) => {
          res.status(401).send("un authorized access");
        });
    } else {
      res.status(401).send("un authorized access");
    }
  });
});
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
