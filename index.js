const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId
const cors = require('cors');
var jwt = require('jsonwebtoken');
const admin = require("firebase-admin");

const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000;

// Firebase admin initialization
var serviceAccount = require("./first-firebase-authentic-df7ba-firebase-adminsdk-ga862-4a6ae3688a.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

// middleware
app.use(cors());
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jbgbo.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const stripe = require("stripe")('sk_test_51Jw4F4HOXxFLrNqIBuXM3R2iCOIn126Q09t07SUGJImydkHBPg6Uxyc9d8bWazIuD9266Ua0EQp7W23ezZVt3Pmi00lIDPjOGy');

async function verifyToken(req, res, next){
  const authHeader = req?.headers?.authorization
  if(authHeader?.startsWith('Bearer ')){
    const idToken = req.headers.authorization.split('Bearer ')[1];
    try{
      const decodeUser = await admin.auth().verifyIdToken(idToken)
      req.decoded = decodeUser.email
    }catch{

    }
  }
  next()
}
// function verifyJWT(req, res, next){
//   const authHeader = req?.headers?.authorization;
//   if(!authHeader){
//     return res.status(401).send({message: 'unauthorized access'})
//   }
//   const idToken = authHeader.split(' ')[1];
//   jwt.verify(idToken, process.env.ACCESS_TOKEN_SECRET,(err, decoded) =>{
//     if(err){
//       return res.status(403).send({message: 'Forbiden access'})
//     }
//     console.log('decoded', decoded);
//   })
//   // console.log('inside verifyJWT', authHeader);
//   next();
// }

async function run() {
    try {
      await client.connect();
      const database = client.db("wonder-vacation");
      const packagesCollection = database.collection("packages");
      const ordersCollection = database.collection("order");
      const usersCollection = database.collection('user')

  // GET Packages API
    app.get('/packages', async(req, res) =>{
    const cursor = packagesCollection.find({});
    const packages = await cursor.toArray();
    res.send(packages);
    
      });
  // GET SINGLE product
    app.get('/packages/:id', async(req, res) =>{
    const id = req.params.id;
    const query = {_id: ObjectId(id)};
    const package = await packagesCollection.findOne(query);
    res.json(package)
  });
  // GET Orders API
    app.get('/orders', async(req, res) =>{
    const email = req.query;
    const cursor = ordersCollection.find({});
    const package = await cursor.toArray();
    res.json(package)
  });

  // GET Single Orders API
  app.get('/orders/:id', async(req, res) =>{
    const id = req.params.id;
    const query = {_id: ObjectId(id)};
    const result = await ordersCollection.findOne(query);
    console.log(result);
    res.json(result)
  })
    
  // GET Order API Email
  // app.get('/orders/:email', async(req, res)=>{
  //     const email = req.params.email;
  //     console.log(email);
  //     const cursor = ordersCollection.find({'data.email': email })
  //     const order = await cursor.toArray()
  //     res.json(order)    
  // })

  //GET  My order
app.get("/orders/:email", async (req, res) => {
  const email = req.params.email;
  const query = {email: email};
  const result = await ordersCollection.find(query)
  .toArray();
  res.send(result);
})
// GET Users 
  app.get('/users', async (req, res)=>{
    const users = req.body;
    const result = await usersCollection.find({}).toArray();
    res.send(result)
  });
// Check User Admin
  app.get('/users/:email', async(req, res) =>{
    const email = req.params.email;
    const query = { email: email };
    const user = await usersCollection.findOne(query);
    let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
  });
  
  // Packages Post
  app.post('/packages', async(req,res)=>{
    const package = req.body;
    const result = await packagesCollection.insertOne(package)
    res.json(result)
  });
  // Order Post
  app.post("/orders", async(req, res) =>{
    const order = req.body;
    const result = await ordersCollection.insertOne(order);
    res.send(result)
  })

  // Add users
app.post("/users", async (req, res) => {
  const result = await usersCollection.insertOne(req.body);
  res.send(result);
});

  // // Login Post
  // app.post("/login", async(req, res) =>{
  //   const user = req.body
  //   const accessToken =jwt.sign(user, process.env.ACCESS_TOKEN_SECRET,{
  //     expiresIn: '1d'
  //   });
  //   res.send({accessToken})
  // })
   // ADD Packages POST API
   app.post('/addPackage', async(req, res)=>{
      const service = req.body;
      // create a document to insert
      const result = await packagesCollection.insertOne(service);
      // console.log(result);
      res.json(result)
    });
    app.delete("/packages/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await packagesCollection.deleteOne(query);
      res.json(result);
    });
    // delete Order
    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await ordersCollection.deleteOne(query);
      res.json(result);
    });
    
    app.put('/users/:email', async(req, res) =>{
      const email = req.params.email;
      const user = req.body;
      const filter = {email:email};
      const options = {upsert: true};
      const updateDoc = {$set: user};
        const result = await usersCollection.updateOne(filter, updateDoc, options);
        res.send(result)
    });

    app.put('/users', async(req, res) =>{
      const email = req.params.email;
      const user = req.body;
      const filter = {email:email};
      const options = {upsert: true};
      const updateDoc = {$set: user};
        const result = await usersCollection.updateOne(filter, updateDoc, options);
        res.send(result)
    });

    // Make An Admin
    app.put("/users/makeadmin", async (req, res) => {
      const user = req.body;
      console.log('put', user);
      const filter = {email: user.email};
      const updateDoc = { $set: {role: 'admin'}};
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result);
    });
  // delete Packages
    app.put("/orders/:id", async (req, res) =>{
      const id = req.params.id;
      const payment = req.body;
      const filter = {_id: ObjectId(id)};
      const updateDoc = {
        $set: {
          payment: payment
        },
      };
      const result = await ordersCollection.updateOne(filter, updateDoc)
      res.json(result)
    });

// app.put("/orders/:email", async (req, res) =>{
//   const email = req.params.email;
//   const user = req.body;
//   const filter = {email: email};
//   const options = {upsert: true};
//   const updateDoc = {
//     $set: user,
//   };
//   const result = await ordersCollection.updateOne(filter, updateDoc, options);
//   // const token = jwt.sign({email: email}, process.env.ACCESS_TOKEN_SECRET,{ expiresIn: '1h' })
//   res.send({result, token})
// });

app.post("/create-payment-intent", async (req, res) => {
  const paymentInfo = req.body;
  const amount = paymentInfo.price * 100;
  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    currency: "usd",
    amount: amount,
    payment_method_types: ['card']
  });
  res.json({clientSecret: paymentIntent.client_secret});
});

} 
  finally {
    //   await client.close();
    }
  }
  run().catch(console.dir);
  
  app.get('/', (req,res) =>{
    res.send('wonder-vacancy')
});
app.listen(port, () =>{
    console.log('Running the server on Port', port);
})