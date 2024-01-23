const express = require('express');
const db = require('./config/connection');
const userRoutes = require("./routes/user");
const postRoutes = require("./routes/post");
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors({
  origin: '*'
}));

app.use('/api',userRoutes);
// app.use('/post',postRoutes)

app.get('/', (req, res) => {
  console.log("vannade")
    res.send('Hello World!');
});

app.listen(8000, () => {
    console.log('Server listening on port 8000');
});