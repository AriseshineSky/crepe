const { MongoClient } = require("mongodb");
const uri = "mongodb://127.0.0.1:27017";
const client = new MongoClient(uri);
function connect(callback) {
  async function run() {
    try {
      // Connect the client to the server (optional starting in v4.7)
      await client.connect();
      console.log("connected!")
      // Establish and verify connection
      await callback(client);
      
    } finally {
      // Ensures that the client will close when you finish/error
      // await client.close();
      // console.log("closed!")
    }
  }
  run().catch(console.dir);
}

module.exports = {
  connect
}