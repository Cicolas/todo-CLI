#!/usr/bin/env node

const path = require('path')
const fs = require('fs');
const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.resume();

////////////////////////

const initialData = "# Todo\n\nA basic todo markdown file\n\n- [x] create a file"

////////////////////////

const colors = require('colors');
const { exit } = require('process');
var cursor = require('ansi')(process.stdout)
cursor.hide()

const a = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

let title = "TODOS"
let description = ""
let todos = []
let file = ".todo.md"
let fileData = ""
let linesArray = []
let deleted = []
let selected = 0
let querrying = false

function register() {
    process.stdin.on('keypress', (str, key) => {
        if (key.ctrl) {
            if (key.name === "c") {
                save()
            }
            if (key.name === "up") {
                selected = 0
                printTodos()
            }
            if (key.name === "down") {
                selected = todos.length + 1
                printTodos()
            }
        } else {
            if (!querrying && key.name === "up") {
                selected -= (selected - 1 < 0) ? 0 : 1;
                printTodos()
            } else if (!querrying && key.name === "down") {
                selected += (selected + 1 > todos.length + 2) ? 0 : 1;
                printTodos()
            } else if (!querrying && (key.name === "space" || key.name === "return")) {
                if (selected < todos.length) {
                    todos[selected].completed = !todos[selected].completed;
                    printTodos()
                } else if (selected == todos.length) {
                    createTodo();
                } else if (selected == todos.length + 1) {
                    save();
                } else if (selected == todos.length + 2) {
                    deleteCompleted()
                }
            } else if (querrying && key.name === "return") {
                createTodo();
                querrying = false
            }
        }
    });
}

function setup() {
    if (process.argv.length > 2) {
        if (process.argv[2] == "init") {
            fs.writeFile(path.join(process.cwd(), ".todo.md"), initialData, (err) => {
                if (err) {
                    throw err
                }
                process.exit()
            })
            return
        }
    }

    file = path.join(process.cwd(), ".todo.md")
    if (process.argv.length > 2) {
        file = path.join(process.cwd(), process.argv[2])
    }
    fs.readFile(file, function(err, data) {
        if (err) {
            cursor.show()
            if (err.code == "ENOENT") {
                console.log("file ".red + file.bold + " doesn't exist in this directory ".red);
                process.exit()
            }
            throw err
        }
        fileData = data.toString()
        fileData = fileData.replace(/\r/g, "")
        linesArray = fileData.split("\n").filter(v => v !== "");

        title = linesArray[0].replace("#", "").trim();
        description = linesArray[1].trim();
        console.log(linesArray);

        linesArray = linesArray.filter(value =>
            (value.search(/- \[ \] /) != -1) ||
            (value.search(/- \[x\] /) != -1)
        )

        for (let i = 0; i < linesArray.length; i++) {
            const v = linesArray[i];
            const value = v.substring(v.search(/\[/) + 1, v.search(/\]/))
            const name = v.substring(v.search(/\]/) + 2, v.length)
            addTodo(name, value == "x" ? true : false)
        }
        printTodos()
    });
}

function convertTodo(t) {
    const vv = t.substring(t.search(/\[/) + 1, t.search(/\]/))
    let n = t.substring(t.search(/\]/) + 2, t.length)
    const a = { name: n, completed: vv == "x" ? true : false, isNew: false }
    return a
}

function save() {
    for (let i = 0; i < todos.length; i++) {
        const v = todos[i];

        const a = `- [${v.completed?"x": " "}] ${v.name}`;

        if (v.isNew) {
            fileData += "\n" + a;
            v.isNew = false
        } else {
            for (let i = 0; i < linesArray.length; i++) {
                const value = linesArray[i];
                if (convertTodo(value).name == v.name && !(deleted.find(x => x.name == convertTodo(value).name))) {
                    // console.log(value);
                    fileData = fileData.replace(value, a);
                }
            }
        }
    }
    // process.exit()

    if (deleted.length > 0) {
        for (let i = 0; i < deleted.length; i++) {
            const v = deleted[i];

            for (let i = 0; i < linesArray.length; i++) {
                const value = linesArray[i];
                if (convertTodo(value).name == v.name) {
                    fileData = fileData.replace("\n" + value, "")
                }
            }
        }
    }

    fs.writeFile(file, fileData, function(err) {
        if (err) return console.log(err);

        cursor.show()
        process.exit();
    });
}

function printTodos() {
    console.clear()
    console.log(`---${title}---\n`.rainbow);
    if (description) {
        console.log(`${description}\n`.white);
    }

    for (const v in todos) {
        let a = `[${todos[v].completed?"x": " "}] ${todos[v].name}`
        a = v == selected ? a.bold : a;

        if (todos[v].completed) {
            a = a.green
            console.log(`${v==selected?">": "-"} `.white + a.green);
        } else {
            console.log(`${v==selected?">": "-"} `.white + a);
        }
    }

    let create = `create a new `.grey + 'todo'.blue.underline
    create = selected == todos.length ? create.bold : create;
    console.log(`${selected==todos.length?"> ": ""}`.white + create);

    let save = 'save and '.grey + 'exit'.red
    save = selected == todos.length + 1 ? save.bold : save;
    console.log(`${selected==todos.length+1?"> ": ""}`.white + save);

    let deleteC = ' delete completed '
    deleteC = selected == todos.length + 2 ? deleteC.bgRed.bold.white : deleteC.black.bgBlack;
    console.log(`${selected==todos.length+2?"> ": ""}`.white + deleteC);
}

function addTodo(n, c = false, _isNew = false) {
    todos.push({ name: n, completed: c, isNew: _isNew })
}

function createTodo() {
    if (!querrying) {
        cursor.show()
        printTodos();
        querrying = true
        let str = ""

        a.question(" add todo name \n".bgWhite.black, (e) => {
            console.log(e);
            str = e
            addTodo(str, false, true)
            printTodos();
            cursor.hide()
        })
    }
}

function deleteCompleted() {
    deleted = todos.filter(v => v.completed)
    todos = todos.filter(v => !v.completed)
    selected = 0
    printTodos()
}

setup()
register()