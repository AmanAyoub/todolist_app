const { Client } = require('pg');
const { dbQuery } = require('./db-query');

module.exports = class PgPersistence {
  isDoneTodoList(todoList) {
    return todoList.todos.length > 0 && todoList.todos.every(todo => todo.done);
  }

  async sortedTodoLists() {
    const ALL_TODOLISTS = "SELECT * FROM todolists ORDER BY lower(title) ASC";
    const FIND_TODOS = "SELECT * FROM TODOS WHERE todolist_id = $1";

    let result = await dbQuery(ALL_TODOLISTS);
    let todoLists = result.rows;

    for (let index = 0; index < todoLists.length; ++index) {
      let todoList = todoLists[index];
      let todos = await dbQuery(FIND_TODOS, todoList.id);
      todoList.todos = todos.rows;
    }

    return this._partitionTodoLists(todoLists);
  }

  _partitionTodoLists(todoLists) {
    let done = [];
    let undone = [];
    todoLists.forEach(todoList => {
      if (this.isDoneTodoList(todoList)) {
        done.push(todoList);
      } else {
        undone.push(todoList);
      }
    });

    return undone.concat(done);
  }


  async sortedTodos(todoList) {
    let SQL = `SELECT * FROM todos WHERE todolist_id = $1
                 ORDER BY done ASC, lower(title) ASC`;
    let result = await dbQuery(SQL, todoList.id);
    return result.rows;
  }

  async loadTodoList(todoListId) {
    let FIND_TODOLIST = "SELECT * FROM todoLists WHERE id = $1"
    let FIND_TODOS = "SELECT * FROM TODOS WHERE todolist_id = $1";
    let resultTodoList = dbQuery(FIND_TODOLIST, todoListId);
    let resultTodos = dbQuery(FIND_TODOS, todoListId);
    let resultBoth = await Promise.all([resultTodoList, resultTodos]);

    let todoList = resultBoth[0].rows[0];
    if (!todoList) return undefined;

    todoList.todos = resultBoth[1].rows;
    return todoList;
  }

  // Does the todoList have any undone todos? If so return true otherwise false.
  hasUndoneTodos(todoList) {
    return todoList.todos.some(todo => !todo.done);
  }

  // Find the todo from a specific todolist, return it, otherwise return undefined.
  async loadTodo(todoListId, todoId) {
    const FIND_TODO = "SELECT * FROM todos WHERE todolist_id = $1 AND id = $2";

    let result = await dbQuery(FIND_TODO, todoListId, todoId);
    return result.rows[0];
  };

  // Toggle the done property value in the indicated todolist todo object.
  async toggleDoneTodo(todoListId, todoId) {
    let TOGGLE_TODO = `UPDATE todos SET done = NOT done
                        WHERE todolist_id = $1 AND id = $2`
    let result = await dbQuery(TOGGLE_TODO, todoListId, todoId);
    return result.rowCount > 0;
  }

  // Delete the todo in the specified todo list.
  async deleteTodo(todoListId, todoId) {
    const DELETE_TODO = "DELETE FROM todos WHERE todolist_id = $1 AND id = $2";

    let result = await dbQuery(DELETE_TODO, todoListId, todoId);
    return result.rowCount > 0;
  }

  // Delete the specified todo list.
  async deleteTodoList(todoListId) {
    const DELETE_TODOLIST = "DELETE FROM todolists WHERE id = $1";

    console.log('todolistid', todoListId);
    console.log(typeof todoListId);
    let result = await dbQuery(DELETE_TODOLIST, todoListId);
    return result.rowCount > 0;
  }

  // Mark all todos as done in the specified todolist. Return false if it fails to do so.
  async markAllDone(todoListId) {
    let MARK_TODOS = `UPDATE todos SET done = true 
                        WHERE todolist_id = $1 AND NOT done`;

    let result = await dbQuery(MARK_TODOS, todoListId);
    return result.rowCount > 0;
  }

  // Add the todo to the specified todolist.
  async addTodo(todoListId, todoTitle) {
    let ADD_TODO = `INSERT INTO todos (title, todolist_id)
                      VALUES ($1, $2)`;
    
    let result = await dbQuery(ADD_TODO, todoTitle, todoListId);
    return result.rowCount > 0;
  }

  // Create a todolist.
  async createTodoList(title) {
    const CREATE_TODOLIST = `INSERT INTO todolists (title)
                              VALUES ($1)`;
    try {
      let result = await dbQuery(CREATE_TODOLIST, title);
      return result.rowCount > 0;
    } catch (err) {
      if (this.isUniqueConstraintViolation(err)) return false;
      throw err;
    }

  }

  // Change the title of the specified todolist.
  async setTodoListTitle(todoListId, title) {
    let CHANGE_TITLE = "UPDATE todolists SET title = $1 WHERE id = $2";

    let result = await dbQuery(CHANGE_TITLE, title, todoListId);
    return result.rowCount > 0;
  }

  // Is there a todolist with the indicated title? If so return true otherwise false.
  async existsTodoListTitle(title) {
    let TODOLIST_EXISTS = "SELECT * FROM todolists WHERE lower(title) = lower($1)";

    let result = await dbQuery(TODOLIST_EXISTS, title);
    return result.rowCount > 0;
  }

  isUniqueConstraintViolation(error) {
    return /duplicate key value violates unique constraint/.test(String(error));
  }
};