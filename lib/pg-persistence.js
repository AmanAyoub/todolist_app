const { Client } = require('pg');
const { dbQuery } = require('./db-query');
const bcrypt = require('bcrypt');

module.exports = class PgPersistence {
  constructor(session) {
    this.username = session.username;
  }

  isDoneTodoList(todoList) {
    return todoList.todos.length > 0 && todoList.todos.every(todo => todo.done);
  }

  async sortedTodoLists() {
    const ALL_TODOLISTS = "SELECT * FROM todolists WHERE username = $1 ORDER BY lower(title) ASC";
    const ALL_TODOS = "SELECT * FROM TODOS WHERE username = $1";

    let resultTodolists = dbQuery(ALL_TODOLISTS, this.username);
    let resultTodos = dbQuery(ALL_TODOS, this.username);
    let resultBoth = await Promise.all([resultTodolists, resultTodos]);

    let allTodoLists = resultBoth[0].rows;
    let allTodos = resultBoth[1].rows;

    if (!allTodoLists || !allTodos) return undefined;
    allTodoLists.forEach(todoList => {
      todoList.todos = allTodos.filter(todo => todo.todolist_id === todoList.id);
    });

    return this._partitionTodoLists(allTodoLists);
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
    let SQL = `SELECT * FROM todos WHERE todolist_id = $1 AND username = $2
                 ORDER BY done ASC, lower(title) ASC`;
    let result = await dbQuery(SQL, todoList.id, this.username);
    return result.rows;
  }

  // Validate the user credentials.
  async validateCredentials(username, password) {
    let VALIDATE = "SELECT password FROM users WHERE username = $1";

    let result = await dbQuery(VALIDATE, username);
    console.log('Heres', result);
    if (result.rowCount === 0) return false;

    return bcrypt.compare(password, result.rows[0].password);
  }

  async loadTodoList(todoListId) {
    let FIND_TODOLIST = "SELECT * FROM todoLists WHERE id = $1 AND username = $2"
    let FIND_TODOS = "SELECT * FROM TODOS WHERE todolist_id = $1 AND username = $2";
    let resultTodoList = dbQuery(FIND_TODOLIST, todoListId, this.username);
    let resultTodos = dbQuery(FIND_TODOS, todoListId, this.username);
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
    const FIND_TODO = `SELECT * FROM todos WHERE todolist_id = $1
                                        AND id = $2 AND username = $3`;

    let result = await dbQuery(FIND_TODO, todoListId, todoId, this.username);
    return result.rows[0];
  };

  // Toggle the done property value in the indicated todolist todo object.
  async toggleDoneTodo(todoListId, todoId) {
    let TOGGLE_TODO = `UPDATE todos SET done = NOT done
                        WHERE todolist_id = $1 AND id = $2
                          AND username = $3`
    let result = await dbQuery(TOGGLE_TODO, todoListId, todoId, this.username);
    return result.rowCount > 0;
  }

  // Delete the todo in the specified todo list.
  async deleteTodo(todoListId, todoId) {
    const DELETE_TODO = `DELETE FROM todos WHERE todolist_id = $1 
                                                AND id = $2 AND username = $3`;

    let result = await dbQuery(DELETE_TODO, todoListId, todoId, this.username);
    return result.rowCount > 0;
  }

  // Delete the specified todo list.
  async deleteTodoList(todoListId) {
    const DELETE_TODOLIST = "DELETE FROM todolists WHERE id = $1 AND username = $2";

    console.log('todolistid', todoListId);
    console.log(typeof todoListId);
    let result = await dbQuery(DELETE_TODOLIST, todoListId, this.username);
    return result.rowCount > 0;
  }

  // Mark all todos as done in the specified todolist. Return false if it fails to do so.
  async markAllDone(todoListId) {
    let MARK_TODOS = `UPDATE todos SET done = true 
                        WHERE todolist_id = $1 AND NOT done AND username = $2`;

    let result = await dbQuery(MARK_TODOS, todoListId, this.username);
    return result.rowCount > 0;
  }

  // Add the todo to the specified todolist.
  async addTodo(todoListId, todoTitle) {
    let ADD_TODO = `INSERT INTO todos (title, todolist_id, username)
                      VALUES ($1, $2, $3)`;
    
    let result = await dbQuery(ADD_TODO, todoTitle, todoListId, this.username);
    return result.rowCount > 0;
  }

  // Create a todolist.
  async createTodoList(title) {
    const CREATE_TODOLIST = `INSERT INTO todolists (title, username)
                              VALUES ($1, $2)`;
    try {
      let result = await dbQuery(CREATE_TODOLIST, title, this.username);
      return result.rowCount > 0;
    } catch (err) {
      if (this.isUniqueConstraintViolation(err)) return false;
      throw err;
    }

  }

  // Change the title of the specified todolist.
  async setTodoListTitle(todoListId, title) {
    let CHANGE_TITLE = "UPDATE todolists SET title = $1 WHERE id = $2 AND username = $3";

    let result = await dbQuery(CHANGE_TITLE, title, todoListId, this.username);
    return result.rowCount > 0;
  }

  // Is there a todolist with the indicated title? If so return true otherwise false.
  async existsTodoListTitle(title) {
    let TODOLIST_EXISTS = "SELECT * FROM todolists WHERE lower(title) = lower($1)" +
                                                  "  AND username = $2";

    let result = await dbQuery(TODOLIST_EXISTS, title, this.username);
    return result.rowCount > 0;
  }

  isUniqueConstraintViolation(error) {
    return /duplicate key value violates unique constraint/.test(String(error));
  }
};