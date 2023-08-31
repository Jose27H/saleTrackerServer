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