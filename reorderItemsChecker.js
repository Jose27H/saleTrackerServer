const nodemailer = require('nodemailer');


// Function to check for items within 7 days of reorder date
async function checkReorderItems(db) {
    try {
      const currentDate = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(currentDate.getDate() + 7);
  
      const query = `
      SELECT 
      items_sold.soldid,
      items_sold.Item_name,
      items_sold.saleid,
      items_sold.reorder_date,
      items_sold.price,
      items_sold.hasCalled,
      customers.name AS customer_name
    FROM 
      items_sold
    INNER JOIN 
      sales ON items_sold.saleid = sales.saleid
    INNER JOIN 
      customers ON sales.customerid = customers.phonenumber
    WHERE 
      items_sold.reorder_date >= $1 
      AND items_sold.reorder_date <= $2 
      AND items_sold.hasCalled = false;
      `;
  
      const { rows } = await db.query(query, [currentDate, sevenDaysFromNow]);
  
      for (const row of rows) {
        // Send an email using nodemailer
        const transporter = nodemailer.createTransport({
          // Add your email configuration here
          service: 'gmail',
          auth: {
            user: 'saletrackerjs@gmail.com',
            pass: 'lootdbowstkoljaf',
          },
        });
  
        const mailOptions = {
          from: 'saletrackerjs@gmail.com',
          to: 'josehilario27@hotmail.com',
          subject: `Item Reorder Reminder for ${row.customer_name}`,
          text: `Item "${row.item_name} " from patient ${row.customer_name} needs to be reordered by  ${row.reorder_date}.`,
        };
  
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Error sending email:', error);
          } else {
            console.log('Email sent:', info.response);
          }
        });
  
        // Mark the item as hasCalled = true in the database
        const updateQuery = `
          UPDATE items_sold
          SET hascalled = true
          WHERE soldid = $1;
        `;
  
        await db.query(updateQuery, [row.soldid]);
      }
  
    } catch (error) {
      console.error('Error checking reorder items:', error);
    }
  }
  module.exports = checkReorderItems;