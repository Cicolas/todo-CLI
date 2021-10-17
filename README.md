# TODO-CLI

todo-cli is a command line software to create and manage your tasks of your project

## Dependency

To install todo-cli, you just need npm setting and working on your machine.

## Instalation

Installation is pretty easy and strightfoward, just run the following command.

```bash
> npm install @cicolas/todo-cli -g
```

Done, now you already have todo-cli working proppely in your pc

## Usage Guide

Usage is very simple, all you need to do is run `todo-cli` or `todo` in any folder. **By default the command will search for a file named .todo.md**, if you wanna load any other file just put it path after the command

```bash
> todo-cli init //to initialize the todo file
> todo-cli <file_relative_path>
```

## Commands

the interface it's very simple, you control your selection using <kbd>Up</kbd>/<kbd>Down</kbd> and select with <kbd>Space</kbd>/<kbd>Enter</kbd>

```bash
---TODOS---

> [x] publish in npm
- [ ] refactor the code
- [ ] accept aditional args(ex.: --delete, --clear)
create a new todo
save and exit
delete completed
```