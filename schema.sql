-- Add the url_path column to the flashcards table
ALTER TABLE flashcards 
ADD COLUMN url_path TEXT;

-- Update existing records to set url_path based on collection_name
UPDATE flashcards 
SET url_path = LOWER(REPLACE(collection_name, ' ', '_')) || '/' || FLOOR(1000 + RANDOM() * 9000)::TEXT;

-- Create an index for faster queries on url_path
CREATE INDEX flashcards_url_path_idx ON flashcards (url_path);

