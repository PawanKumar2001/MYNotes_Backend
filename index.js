require("dotenv").config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectToMongo = require('./database');

connectToMongo();
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

// Serve static files from the React build directory
// app.use(express.static(path.join(__dirname, '../build')));

// Define API routes
app.use('/api/authorization', require('./Routes/authorization'));
app.use('/api/notes', require('./Routes/notes'));

// Serve index.html for React routing
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '../build', 'index.html'));
// });

// Start the server
app.listen(port, () => {
  console.log(`MyNotes API running on port ${port}`);
});
