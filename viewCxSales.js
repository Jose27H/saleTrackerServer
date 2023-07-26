async function grabCxsales(number, db) {
    const query = `
      SELECT customers.name AS customerName, customers.phonenumber, sales.saleid, COUNT(items_sold.item_name) AS totalItems FROM customers
      JOIN sales ON customers.phonenumber = sales.customerid
      JOIN items_sold ON sales.saleid = items_sold.saleid
      WHERE customers.phonenumber = $1
      GROUP BY sales.saleid, customers.name, customers.phonenumber
      ORDER BY sales.saleid DESC
    `;
  
    try {
      const { rows } = await db.query(query, [number]);
      return rows;
    } catch (error) {
      console.error("Error retrieving sale items:", error);
      throw new Error("Failed to Retrieve Sale Items");
    }
  }

  module.exports = grabCxsales;