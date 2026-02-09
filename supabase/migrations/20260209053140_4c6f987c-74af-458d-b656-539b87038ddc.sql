-- Update resource_category enum: rename physics→training, physiology→nutrition, process→lifestyle

-- Step 1: Create a new enum type with the new values
CREATE TYPE resource_category_new AS ENUM ('training', 'nutrition', 'lifestyle');

-- Step 2: Alter the vault_resources table to use the new enum
-- First, we need to change the column type using a temporary text column
ALTER TABLE vault_resources 
  ALTER COLUMN category TYPE text 
  USING category::text;

-- Step 3: Update the values
UPDATE vault_resources 
SET category = CASE 
  WHEN category = 'physics' THEN 'training'
  WHEN category = 'physiology' THEN 'nutrition'
  WHEN category = 'process' THEN 'lifestyle'
  ELSE category
END;

-- Step 4: Convert back to the new enum
ALTER TABLE vault_resources 
  ALTER COLUMN category TYPE resource_category_new 
  USING category::resource_category_new;

-- Step 5: Drop the old enum and rename the new one
DROP TYPE resource_category;
ALTER TYPE resource_category_new RENAME TO resource_category;