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

the interface it's very simple, you control your selection using <kbd>Up</kbd>/<kbd>Down</kbd> and select with <kbd>Space</kbd>/<kbd>Enter</kbd> and toggle mode with <kbd>left</kbd>/<kbd>right</kbd>

```bash
---TODOS---

[complete-delete]
> [x] publish in npm
- [ ] refactor the code
- [ ] accept aditional args(ex.: --delete, --clear)
create a new todo
save and exit
delete all marked
delete completed
```

## Patch Notes

- ver 1.1.3
  - added -h flag for help
    - it wont work for commands yet (like 'todo init -h')
  - correct a bug where 'todo -g file.md' would load '.todo.md'
- ver 1.1.2
  - minor corrections
- ver 1.1.1
  - minor corrections
- ver 1.1.0
  - added -g flag for global todo files
  - added "delete mode"
    - you can toggle with <kbd>left</kbd>/<kbd>right</kbd>
    - in delete mode you will mark the todos to delete 