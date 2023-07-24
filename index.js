const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const checkReorderItems = require('./reorderItemsChecker');
const createCalledTrigger = require('./calledTrigger');


const app = express();
const port = 3000; // Set your desired port number

// Enable CORS middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Create a new instance of the Pool
const db = new Pool({
  connectionString: 'postgresql://postgres:OKW4XHsFBhiWQu4YsRpd@containers-us-west-100.railway.app:5975/railway',
});



// // // Drop the items_sold table
// db.query('DROP TABLE IF EXISTS items_sold CASCADE', (err, result) => {
//   if (err) {
//     console.error('Error dropping items_sold table:', err);
//   } else {
//     console.log('items_sold table dropped successfully');
//     // Proceed to drop other tables after items_sold table is dropped
//     dropTables();
//   }
// });

// // Function to drop the sales and customers tables
// const dropTables = () => {
//   // Drop the sales table
//   db.query('DROP TABLE IF EXISTS sales CASCADE', (err, result) => {
//     if (err) {
//       console.error('Error dropping sales table:', err);
//     } else {
//       console.log('sales table dropped successfully');
//       // Drop the customers table
//       db.query('DROP TABLE IF EXISTS customers CASCADE', (err, result) => {
//         if (err) {
//           console.error('Error dropping customers table:', err);
//         } else {
//           console.log('customers table dropped successfully');
//           // All tables dropped, proceed to create tables
//           createTables();
//         }
//       });
//     }
//   });
// };

// // Function to create the tables
// const createTables = () => {
//   // Create customers table query
//   const createCustomersTableQuery = `
//     CREATE TABLE customers (
//       phonenumber VARCHAR(255) NOT NULL PRIMARY KEY,
//       name VARCHAR(255),
//       date_of_birth DATE,
//       state VARCHAR(255),
//       email VARCHAR(255)
//     );
//   `;

//   // Create sales table query
//   const createSalesTableQuery = `
//     CREATE TABLE sales (
//       saleID SERIAL PRIMARY KEY,
//       customerID TEXT NOT NULL,
//       date DATE DEFAULT CURRENT_DATE,
//       isClosed BOOLEAN DEFAULT FALSE,
//       FOREIGN KEY (customerID) REFERENCES customers (phonenumber) ON DELETE CASCADE
//     );
//   `;

//   // Create items_sold table query
//   const createItemsSoldTableQuery = `
//     CREATE TABLE items_sold (
//       soldID SERIAL PRIMARY KEY,
//       Item_name VARCHAR(255) NOT NULL,
//       saleid INTEGER REFERENCES sales (saleid) ON DELETE CASCADE,
//       reorder_date DATE,
//       price DECIMAL(10, 2),
//       hasCalled BOOLEAN DEFAULT FALSE
//     );
//   `;

//   // Execute the queries using db.query method
//   db.query(createCustomersTableQuery)
//     .then(() => {
//       console.log('Customers table created successfully');
//       return db.query(createSalesTableQuery);
//     })
//     .then(() => {
//       console.log('Sales table created successfully');
//       return db.query(createItemsSoldTableQuery);
//     })
//     .then(() => {
//       console.log('Items Sold table created successfully');
//     })
//     .catch((error) => {
//       console.error('Error creating tables:', error);
//     });
// };

// // Drop tables first, then create new tables
// dropTables();
// createCalledTrigger(db);


app.post('/api/addToSale', (req, res) => {
  const { saleID, productName, daysUntilRefill, price } = req.body;

  // Convert daysUntilRefill to an integer using parseInt
  const days = parseInt(daysUntilRefill);

    // Check if the conversion was successful
    if (isNaN(days)) {
      // Handle the error when the string cannot be converted to an integer
      console.log(days)
      res.status(400).json({ error: 'Invalid daysUntilRefill value' });
      return;
    }

  const getRefillDate = (days) => {
    const today = new Date();
    const refillDate = new Date(today.setDate(today.getDate() + days));
    return refillDate;
  };

  const refillDate = getRefillDate(days);
  console.log(refillDate);


  db.query(`INSERT INTO items_sold( item_name, saleid, reorder_date, price)
  VALUES($1, $2, $3, $4)`,
  [productName, saleID, refillDate, price ],
  (err, result) => {
    if(err){
      res.status(400).json({error: "item not inserted"});
    }
  else{
    res.status(200).json({ Success: "Item inserted correctly"})
  }
  }
  )

});///add to sale

app.get('/api/saleItems', (req, res) => {
  const { saleID } = req.query;
  db.query(
    'SELECT soldid, item_name, saleid, reorder_date, price, hascalled FROM items_sold WHERE saleid = $1 ',
    [saleID],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to Retrieve Items' });
      } else {
        const items = result.rows;
        
        const totalPrice = items.reduce((accumulator, item) => accumulator + parseFloat(item.price), 0);
    
        res.status(200).json({ items, totalPrice });
     
      }
    }
  );
});






app.post('/api/form', (req, res) => {
  const { name, email, phoneNumber, selectedDate, state } = req.body;

  db.query(
    `INSERT INTO customers (phonenumber, name, date_of_birth, state, email)
     VALUES ($1, $2, $3, $4, $5)`,
    [phoneNumber, name, selectedDate, state, email],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to submit form' });
      } else {
        const insertQuery = `
          INSERT INTO sales (customerID)
          VALUES ($1)
        `;
        db.query(insertQuery, [phoneNumber], (error, results) => {
          if (error) {
            console.error("Failed to insert into sales table:", error);
            res.status(500).json({ error: 'Failed to submit form' });
          } else {
            console.log("Successfully inserted into sales table");
            res.status(200).json({ success: "New Customer Added Successfully" });
          }
        });
      }
    }
  );
});//form


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
});//form for just the number

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
// Define a route to fetch customer data based on phone number
app.get("/api/customerData", (req, res) => {
  const customerPhoneNumber = req.query.phoneNumber;

  const query = `
    SELECT customers.name, customers.phonenumber, customers.email,
      (SELECT COALESCE(MAX(saleid), 0) FROM sales WHERE customerID = customers.phonenumber) AS currentSaleID
    FROM customers
    WHERE customers.phonenumber = $1
  `;

  db.query(query, [customerPhoneNumber], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    } else if (result.rows.length > 0) {
      const row = result.rows[0];
      const currentSaleID = row.currentsaleid; // Make sure to use lowercase "currentsaleid"
    

      res.json({
        name: row.name,
        phoneNumber: row.phonenumber,
        email: row.email,
        saleID: currentSaleID,
      });
    } else {
      // Return an error if the customer is not found
      res.status(404).json({ error: "Customer not found" });
    }
  });
});



app.post("/api/startSale", (req, res) => {
  const { phoneNumber } = req.body;

  const insertQuery = `
    INSERT INTO sales (customerID)
    VALUES ($1)
  `;

  db.query(insertQuery, [phoneNumber], (error, results) => {
    if (error) {
      console.error("Failed to insert into sales table:", error);
      res.sendStatus(500);
    } else {
      console.log("Successfully inserted into sales table");
      res.sendStatus(200);
    }
  });
})//start a sale

app.get("/api/viewSales", (req, res) => {
  db.query(
    "SELECT customers.name AS customerName, customers.phonenumber, sales.saleid, COUNT(items_sold.item_name) AS totalItems FROM customers " +
    "JOIN sales ON customers.phonenumber = sales.customerid " +
    "JOIN items_sold ON sales.saleid = items_sold.saleid " +
    "WHERE sales.isclosed = false " + // Add the condition here
    "GROUP BY sales.saleid, customers.name, customers.phonenumber " +
    "ORDER BY sales.saleid DESC",
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to Retrieve Sale Items" });
      } else {
        const saleItems = result.rows;
    
        res.status(200).json({ saleItems });
        console.log("Fetching sale items from backend");
      }
    }
  );
});//


app.get("/api/viewClosedSales", (req, res) => {
  db.query(
    "SELECT customers.name AS customerName, customers.phonenumber, sales.saleid, COUNT(items_sold.item_name) AS totalItems FROM customers " +
    "JOIN sales ON customers.phonenumber = sales.customerid " +
    "JOIN items_sold ON sales.saleid = items_sold.saleid " +
    "WHERE sales.isclosed = true " + // Add the condition here
    "GROUP BY sales.saleid, customers.name, customers.phonenumber " +
    "ORDER BY sales.saleid DESC",
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to Retrieve Sale Items" });
      } else {
        const saleItems = result.rows;
    
        res.status(200).json({ saleItems });
        console.log("Fetching sale items from backend");
      }
    }
  );
});//ViewClosedSales


// Import necessary modules and setup your express app

// Function to update the isclosed column in the sales table
const closeSale = async (saleID) => {
  try {
    const updateSalesQuery = 'UPDATE sales SET isclosed = true WHERE saleid = $1';
    const updateItemsQuery = 'UPDATE items_sold SET hascalled = true WHERE saleid = $1';
    const values = [saleID];

    // Update "sales" table to set "isclosed" to true for the specified saleID
    const updateSalesResult = await db.query(updateSalesQuery, values);
    console.log(`Sale ID ${saleID} marked as closed in sales table.`);

    // Update "items_sold" table to set "hascalled" to true for all items with the specified saleID
    const updateItemsResult = await db.query(updateItemsQuery, values);
    console.log(`"hascalled" field set to true for all items in items_sold with saleID ${saleID}.`);

    // Return the number of rows affected in both queries (should be 1 for each)
    return {
      salesRowsAffected: updateSalesResult.rowCount,
      itemsRowsAffected: updateItemsResult.rowCount
    };
  } catch (error) {
    console.error('Error updating sale status:', error);
    return {
      salesRowsAffected: 0,
      itemsRowsAffected: 0
    };
  }
};//close a sale


// Define the route to handle the closeSale request
app.post('/api/closeSale/:saleID', async (req, res) => {
  const saleID = req.params.saleID;
  console.log('Sale ID to close:', saleID);

  try {
    const rowsAffected = await closeSale(saleID);
    if (rowsAffected === 1) {
      // Sale successfully closed
      res.json({ message: `Sale with ID ${saleID} closed successfully!` });
    } else {
      // Sale not found or no rows updated
      res.status(404).json({ error: 'Sale not found or already closed.' });
    }
  } catch (error) {
    // Handle other errors
    console.error('Error closing sale:', error);
    res.status(500).json({ error: 'An error occurred while closing the sale.' });
  }
});//closing the sales





// Schedule the function to run once a day
const interval = 60*1000; // 24 hours
setInterval(() => checkReorderItems(db), interval);







// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
