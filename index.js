const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
// var jwt = require('jsonwebtoken');

const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jbgbo.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// async function verifyToken(req, res, next){
//   const authHeader = req?.headers?.authorization
//   if(authHeader?.startsWith('Bearer ')){
//     const idToken = req.headers.authorization.split('Bearer ')[1];
//     try{
//       const decodeUser = await admin.auth().verifyIdToken(idToken)
//       req.decoded = decodeUser.email
//     }catch{

//     }
//   }
//   next()
// }
async function run() {
    try {
      await client.connect();
      const database = client.db("wonder-vacation");
      const packagesCollection = database.collection("packages");
      const ordersCollection = database.collection("order");
      const usersCollection = database.collection('user');
      const transactionCollection = database.collection('payment');
      const usersReviewCollection = database.collection("reviews");

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

  // ADD Packages POST API
  app.post('/addPackage', async(req, res)=>{
    const service = req.body;
    const result = await packagesCollection.insertOne(service);
    res.json(result)
  });
  app.delete("/packages/:id", async (req, res) => {
    const id = req.params.id;
    const query = { _id: ObjectId(id) };
    const result = await packagesCollection.deleteOne(query);
    res.json(result);
  });

  // Packages Post
    app.post('/packages', async(req,res)=>{
      const package = req.body;
      const result = await packagesCollection.insertOne(package)
      res.json(result)
    });

  // GET Orders API
    app.get('/orders', async(req, res) =>{
    const cursor = ordersCollection.find({});
    const package = await cursor.toArray();
    res.json(package)
  });

  // GET Single Orders API
  app.get('/paymentOrders/:id', async(req, res) =>{
    const id = req.params.id;
    const query = {_id: ObjectId(id)};
    const result = await ordersCollection.findOne(query);
    res.json(result)
  })

      // delete Order
      app.delete("/orders/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) };
        const result = await ordersCollection.deleteOne(query);
        res.json(result);
      });
       // Order Post
    app.post("/orders", async(req, res) =>{
      const order = req.body;
      console.log(order);
      const result = await ordersCollection.insertOne(order);
      res.send(result)
    })
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
  const date = req.query.date;
  const query = {email: email, date: date};
  const result = await ordersCollection.find(query).toArray();
  res.send(result);
})
// GET Users 
  app.get('/users', async (req, res)=>{
    const result = await usersCollection.find().toArray();
    res.send(result)
  });

// Delete Users
app.delete('/users/:id', async(req, res) =>{
  const id = req.params.id;
  const query = { _id: ObjectId(id) };
    const result = await usersCollection.deleteOne(query);
    res.json(result);
})

// Check Users Admin
  app.get('/admin/:email', async(req, res) =>{
    const email = req.params.email;
    const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
        if (user?.role === "admin") {
          isAdmin = true;
        }
        res.json({ admin: isAdmin });    
  });
 
  // Add users
app.post("/users", async (req, res) => {
  const result = await usersCollection.insertOne(req.body);
  res.send(result);
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
    // Make An Admin
    app.put('/users/admin/:email', async(req, res) =>{
      const email = req.params.email;
      const filter = {email:email};
      const updateDoc = {$set: { role: 'admin' }};
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.send(result)
    });

     // Add Users Review
     app.post("/review", async (req, res) => {
      const userReview = req.body;
      const result = await usersReviewCollection.insertOne(userReview);
      res.send(result);
    });

    // Get Users reviews
    app.get("/review", async (req, res) => {
      const result = await usersReviewCollection.find({}).toArray();
      res.send(result);
    });

    app.patch('/paymentOrders/:id', async(req, res) =>{
      const id = req.params.id;
      const payment = req.body;
      const filter = {_id: ObjectId(id)};
      const updateDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId
        }
      }
      const result = await transactionCollection.insertOne(payment)
      const updatedBooking = await ordersCollection.updateOne(filter, updateDoc);
      res.send(updatedBooking);
    });
 
// Payment Intent
app.post("/create-payment-intent", async (req, res) => {
  const paymentInfo = req.body;
 if(paymentInfo?.price){
  const amount = paymentInfo.price * 100;
  const paymentIntent = await stripe.paymentIntents.create({
    currency: "usd",
    amount: amount,
    payment_method_types: ['card']
  });
  res.json({clientSecret: paymentIntent.client_secret});
}});

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