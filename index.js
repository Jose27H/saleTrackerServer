const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const port = 3000; // Set your desired port number

// Enable CORS middleware
app.use(cors());
app.use(bodyParser.json());

// Create a new instance of the Pool
const db = new Pool({
  connectionString: 'postgresql://postgres:OKW4XHsFBhiWQu4YsRpd@containers-us-west-100.railway.app:5975/railway',
});

// Set up your routes and middleware here

// 
// app.get('/', (req, res) => {
//   // Example query using the 'db' object
//   db.query(
//     `CREATE TABLE customers (
//       phonenumber VARCHAR(255) NOT NULL PRIMARY KEY,
//       name VARCHAR(255),
//       date_of_birth DATE,
//       state VARCHAR(255)
//     )`,
//     (err, result) => {
//       if (err) {
//         console.error('Error creating table', err);
//         res.status(500).send('Error creating table');
//       } else {
//         res.send('Table created successfully');
//       }
//     }
//   );
// });


app.post('/api/patientData', (req, res) => {
  console.log(req.body)
})

// Endpoint for handling phone check
app.post('/api/formnumber', (req, res) => {

  const { number } = req.body;

  db.query('SELECT COUNT(*) as count, phonenumber FROM customers WHERE phonenumber = $1 GROUP BY phonenumber ', [number], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to check phone number' });
    } else {
      const row = result.rows[0];
      if (row && row.count > 0) {
        res.status(200).json({ info: 'yes', pnumber: row.id });
   
      } else {
        res.status(200).json({ info: 'Failed to submit form' });
      }
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
