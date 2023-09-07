async function reorderTable(db){
    try{
        const query = `
        SELECT * 
        FROM sales_items_view `;

        const { rows } = await db.query(query);
        return rows;

    }
    catch(error){
        console.error("Error retrieving sale items:", error);

    }
}
module.exports = reorderTable;

 async function updateItemInTable(db, itemToUpdate, saleIdToUpdate) {
    try {
      const updateQuery = `
        UPDATE items_sold
        SET hasreordered = true
        WHERE item_name = $1
          AND saleid = $2;
      `;
  
      const { rowCount } = await db.query(updateQuery, [itemToUpdate, saleIdToUpdate]);
      console.log('Rows updated:', rowCount);
    } catch (error) {
      console.error('Error executing SQL query:', error);
    }
  };
  
  module.exports = updateItemInTable;
  