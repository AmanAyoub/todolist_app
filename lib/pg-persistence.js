const { Client } = require('pg');
const { dbQuery } = require('./db-query');

module.exports = class PgPersistence {
  constructor(session) {
    this._todoLists = session.todoLists || deepCopy(SeedData);
    session.todoLists = this._todoLists; 
  }

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

  // // Does the todoList have any undone todos? If so return true otherwise false.
  hasUndoneTodos(todoList) {
  //   return todoList.todos.some(todo => !todo.done);
  }

  // // Find the todo from a specific todolist, return it, otherwise return undefined.
  loadTodo(todoListId, todoId) {
  //   let todo = this._findTodo(todoListId, todoId);
  //   return deepCopy(todo);
  };

  // // Toggle the done property value in the indicated todolist todo object.
  toggleDoneTodo(todoListId, todoId) {
  //   let todo = this._findTodo(todoListId, todoId);
  //   if(!todo) return false;

  //   todo.done = !todo.done;
  //   return true;
  }

  // // Delete the todo in the specified todo list.
  deleteTodo(todoListId, todoId) {
  //   let todoList = this._findTodoList(todoListId);
  //   if (!todoList) return false;

  //   let todoIndex = todoList.todos.findIndex(todo => todo.id === todoId);
  //   if (todoIndex === -1) return false;
  
  //   todoList.todos.splice(todoIndex, 1);
  //   return true;
  }

  // // Delete the specified todo list.
  deleteTodoList(todoListId) {
  //   let todoListIndex = this._todoLists.findIndex(todoList => todoList.id === todoListId);
  //   if (todoListIndex === -1) return false;

  //   this._todoLists.splice(todoListIndex, 1);
  //   return true;
  }

  // // Mark all todos as done in the specified todolist. Return false if it fails to do so.
  markAllDone(todoListId) {
  //   let todoList = this._findTodoList(todoListId);
  //   todoList.todos.forEach(todo => todo.done = true);
  }

  // // Add the todo to the specified todolist.
  addTodo(todoListId, todoTitle) {
  //   let todoList = this._findTodoList(todoListId);
  //   if (!todoList) return false;

  //   let newTodo = {
  //     id: nextId(),
  //     title: todoTitle,
  //     done: false,
  //   }

  //   todoList.todos.push(newTodo);
  //   return true;
  }

  // // Create a todolist.
  createTodoList(title) {
  //   this._todoLists.push({
  //     title,
  //     id: nextId(),
  //     todos: []
  //   });
  //   return true;
  }

  // // Change the title of the specified todolist.
  setTodoListTitle(todoListId, title) {
  //   let todoList = this._findTodoList(todoListId);
  //   if (!todoList) return false;
    
  //   todoList.title = title;
  //   return true;
  }

  // // Is there a todolist with the indicated title? If so return true otherwise false.
  existsTodoListTitle(title) {
  //   return this._todoLists.some(todoList => todoList.title === title);
  }

  _findTodo(todoListId, todoId) {
  //   let todoList = this._findTodoList(todoListId);
  //   if (!todoList) return undefined;

  //   return todoList.todos.find(todo => todo.id === todoId);
  }

  _findTodoList(todoListId) {
  //   return this._todoLists.find(todoList => todoList.id === todoListId);
  }
};