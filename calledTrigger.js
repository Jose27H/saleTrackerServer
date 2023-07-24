

async function createCalledTrigger(db) {
    try {
      // Create the trigger function
      const createFunctionQuery = `
        CREATE OR REPLACE FUNCTION check_and_close_sale()
        RETURNS TRIGGER AS
        $$
        BEGIN
          IF (SELECT COUNT(*) FROM items_sold WHERE saleid = NEW.saleid AND NOT hascalled) = 0 THEN
            UPDATE sales SET isclosed = TRUE WHERE saleid = NEW.saleid;
          END IF;
          RETURN NEW;
        END;
        $$
        LANGUAGE plpgsql;
      `;
  
      await db.query(createFunctionQuery);
  
      // Create the trigger itself
      const createTriggerQuery = `
        CREATE TRIGGER update_sale_status
        AFTER UPDATE OF hascalled ON items_sold
        FOR EACH ROW
        EXECUTE FUNCTION check_and_close_sale();
      `;
  
      await db.query(createTriggerQuery);
  
      console.log('Trigger and trigger function created successfully.');
  
    } catch (error) {
      console.error('Error creating trigger:', error);
    }
  }
  
  module.exports = createCalledTrigger;