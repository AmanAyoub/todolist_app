const SeedData = require('./seed-data');
const deepCopy = require('./deep-copy');
const nextId = require('./next-id');
const { sortTodoLists, sortTodos } = require('./sort');

module.exports = class SessionPersistence {
  constructor(session) {
    this._todoLists = session.todoLists || deepCopy(SeedData);
    session.todoLists = this._todoLists; 
  }

  isDoneTodoList(todoList) {
    return todoList.todos.length > 0 && todoList.todos.every(todo => todo.done);
  }

  sortedTodoLists() {
    let todoLists = deepCopy(this._todoLists);
    let undone = todoLists.filter(todoList => !this.isDoneTodoList(todoList));
    let done = todoLists.filter(todoList => this.isDoneTodoList(todoList));
    return sortTodoLists(undone, done);
  }

  sortedTodos(todoList) {
    let todos = todoList.todos;
    let undone = todos.filter(todo => !todo.done);
    let done = todos.filter(todo => todo.done);
    return deepCopy(sortTodos(undone, done));
  }

  loadTodoList(todoListId) {
    let todoList = this._findTodoList(todoListId);
    return deepCopy(todoList);
  }

  // Does the todoList have any undone todos? If so return true otherwise false.
  hasUndoneTodos(todoList) {
    return todoList.todos.some(todo => !todo.done);
  }

  // Find the todo from a specific todolist, return it, otherwise return undefined.
  loadTodo(todoListId, todoId) {
    let todo = this._findTodo(todoListId, todoId);
    return deepCopy(todo);
  };

  // Toggle the done property value in the indicated todolist todo object.
  toggleDoneTodo(todoListId, todoId) {
    let todo = this._findTodo(todoListId, todoId);
    if(!todo) return false;

    todo.done = !todo.done;
    return true;
  }

  // Delete the todo in the specified todo list.
  deleteTodo(todoListId, todoId) {
    let todoList = this._findTodoList(todoListId);
    if (!todoList) return false;

    let todoIndex = todoList.todos.findIndex(todo => todo.id === todoId);
    if (todoIndex === -1) return false;
  
    todoList.todos.splice(todoIndex, 1);
    return true;
  }

  // Mark all todos as done in the specified todolist. Return false if it fails to do so.
  markAllDone(todoListId) {
    let todoList = this._findTodoList(todoListId);
    todoList.todos.forEach(todo => todo.done = true);
  }

  // Add the todo to the specified todolist.
  addTodo(todoListId, todoTitle) {
    let todoList = this._findTodoList(todoListId);
    if (!todoList) return false;

    let newTodo = {
      id: nextId(),
      title: todoTitle,
      done: false,
    }

    todoList.todos.push(newTodo);
    return true;
  }

  _findTodo(todoListId, todoId) {
    let todoList = this._findTodoList(todoListId);
    if (!todoList) return undefined;

    return todoList.todos.find(todo => todo.id === todoId);
  }

  _findTodoList(todoListId) {
    return this._todoLists.find(todoList => todoList.id === todoListId);
  }
};