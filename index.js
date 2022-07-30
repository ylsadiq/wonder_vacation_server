const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId
const cors = require('cors');
var admin = require("firebase-admin");;

const app = express();
const port = process.env.PORT || 5000;

// Firebase admin initialization
var serviceAccount = require("./first-firebase-authentic-df7ba-firebase-adminsdk-ga862-4a6ae3688a.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

// middleware
app.use(cors());
app.use(express.json())

const uri = "mongodb+srv://wonder-vacation:J8oQ5IhmqMC6bGgs@cluster0.jbgbo.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const stripe = require("stripe")('sk_test_51Jw4F4HOXxFLrNqIBuXM3R2iCOIn126Q09t07SUGJImydkHBPg6Uxyc9d8bWazIuD9266Ua0EQp7W23ezZVt3Pmi00lIDPjOGy');
async function verifyToken(req, res, next){
  if(req.headers?.authorization?.startsWith('Bearer ')){
    const idToken = req.headers.authorization.split('Bearer ')[1];
    try{
      const decodeUser = await admin.auth().verifyIdToken(idToken)
      req.decodeUserEmail = decodeUser.email
    }catch{

    }
  }
  next()
}
async function run() {
    try {
      await client.connect();
      const database = client.db("wonder-vacation");
      const packagesCollection = database.collection("packages");
      const ordersCollection = database.collection("order");

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
  })
    
  // GET Order APi
  app.get('/order', verifyToken, async(req, res)=>{
    const email = req.query.email;
    if(req.decodeUserEmail === email){
      const query = {email: email};
      const cursor = ordersCollection.find({'data.email': email })
      const order = await cursor.toArray()
      res.json(order)
    }else{
      res.status(401).json({massage: 'User Not Authorize'})
    }
    
  })

  // Packages Post
  app.post('/packages', async(req,res)=>{
    const package = req.body;
    const result = await packagesCollection.insertOne(package)
    res.json(result)
  });
  // Order Post
  app.post("/order", async(req, res) =>{
    const order = req.body
    const result = await ordersCollection.insertOne(order);
    res.send(result)
  })


  // delete Order
  app.delete("/order/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: ObjectId(id) };
    const result = await ordersCollection.deleteOne(query);
    res.json(result);
});

app.put("/order/:id", async (req, res) =>{
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
})

app.post("/create-payment-intent", async (req, res) => {
  const paymentInfo = req.body;
  const amount = paymentInfo.price * 100;
  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    currency: "usd",
    amount: amount,
    payment_method_types: ['card']
  });
  res.json({
    clientSecret: paymentIntent.client_secret
  });
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