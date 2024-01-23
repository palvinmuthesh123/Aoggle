const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://ymanish26798:Manish26@cluster0.qxuovrx.mongodb.net/videoApp';

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect()
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.log(err);
  });

module.exports = client;
