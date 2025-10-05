CREATE TABLE todolists (
  id serial PRIMARY KEY,
  title varchar(100) NOT NULL UNIQUE
);

CREATE TABLE todos (
  id serial PRIMARY KEY,
  title varchar(100) NOT NULL,
  done boolean DEFAULT false,
  todolist_id int NOT NULL 
    REFERENCES todolists (id) ON DELETE CASCADE
);