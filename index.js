const express = require('express');
const {MongoClient} = require('mongodb');
const ObjectId = require('mongodb').ObjectId
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json())

const uri = "mongodb+srv://wonder-vacation:ELHDc9PpJs5FljdL@cluster0.jbgbo.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

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
    console.log('getting specific ID', id);
    const query = {_id: ObjectId(id)};
    const package = await packagesCollection.findOne(query);
    res.json(package)
  })
  app.post('/packages', async(req,res)=>{
    const package = req.body;
    const result = await packagesCollection.insertOne(package)
    res.json(result)
  });
  app.get('/order', async(req, res) =>{
    const cursor = ordersCollection.find({});
    const services = await cursor.toArray();
    res.send(services); 
  })

  app.post("/order", async(req, res) =>{
    const order = req.body
    const result = await ordersCollection.insertOne(order);
    res.send(result)
  })
    //   create a document to insert
    //   app.post('/packages',(req, res) =>{
    //       console.log('hit the post');
    //       res.send('post Hitted')
    //   })
    } finally {
    //   await client.close();
    }
  }
  run().catch(console.dir);
  
  app.get('/', (req,res) =>{
    res.send('Running my CURD Server')
});
app.listen(port, () =>{
    console.log('Running the server on Port', port);
})