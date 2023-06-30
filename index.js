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


app.post('/api/form', (req, res) => {
  const { name, email, phoneNumber, selectedDate, state } = req.body;

  db.query(
    `INSERT INTO customers (phonenumber, name, date_of_birth, state , email)
     VALUES ($1, $2, $3, $4, $5)`,
    [phoneNumber, name, selectedDate, state, email],
    (err, result) => {
      if (err) {
         console.error(err);
      
        res.status(200).json({ error: 'Failed to submit form' });
      } else {
        res.status(200).json({ success: "New Customer Added Succesfully" });
      }
    }
  );
});

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

// Endpoint to fetch customers with search term and pagination
app.get('/api/customers', async (req, res) => {
  const { search, page } = req.query;
  const pageSize = 10;
  const offset = (parseInt(page) - 1) * pageSize;

  try {
    let queryStr = '';

    // Check if search term exists
    if (search && search.trim() !== '') {
      // Construct the WHERE clause to search for name, email, or phone number
      queryStr = `SELECT * FROM customers WHERE name ILIKE '%${search}%' OR email ILIKE '%${search}%' OR phonenumber ILIKE '%${search}%'`;
    } else {
      // If search term is empty, return the full list of customers
      queryStr = 'SELECT * FROM customers';
    }

    // Add ORDER BY clause to sort by ID in descending order
   

    // Execute the query with pagination
    queryStr += ` LIMIT ${pageSize} OFFSET ${offset}`;
    const result = await db.query(queryStr);
    const customers = result.rows;

    res.json({ customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Define a route to fetch patient data based on name
app.get("/api/patientData", (req, res) => {
  const patientName = req.query.name;

  // Query the database based on the patient name
  db.query(
    "SELECT * FROM customers WHERE phonenumber = $1",
    [patientName],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
      } else if (result.rows.length > 0) {
        const row = result.rows[0];
        console.log(result.rows[0])
        // Return the patient data if found
        res.json({
          name: row.name,
          phonenumber: row.phonenumber,
          email: row.email,
        
        });
      } else {
        // Return an error if the patient is not found
        res.status(404).json({ error: "Patient not found" });
      }
    }
  );
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
