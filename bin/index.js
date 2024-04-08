#!/usr/bin/env node
//@ts-check

// Feito por: Nícolas dos Santos Carvalho (2022-2023)

// TODO-CLI é um software de linha de comando para facilitar a criacao e manuseio
// de a fazeres para sua aplicação

// TODO: code-review insano
// * Esse código está muito ruim, quem sabe algum dia eu de um tapa nele, mas
// * até esse dia chegar se contente com essa bagunça
// "Tudo que era para ser simples é complexo, e o complexo se torna simples"

/* eslint-disable no-useless-escape */
"use strict";
const path = require('path');
const fs = require('fs');
// process.stdin.setRawMode(true);
// process.stdin.resume();

const generate = require('./scripts/generate');
// eslint-disable-next-line no-unused-vars
const colors = require('colors');
let cursor = require('ansi')(process.stdout);
cursor.hide();

const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
const a = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

//classes and prototypes
////////////////////////
Array.prototype.insert = function (index, value) {
  this[index] = [value, this[index]];
  let f = this.flat();

  for (let i = 0; i < this.length; i++) {
    this[i] = f[i];
  }

  this.push(f[this.length]);
};

class TodoItem {
  name; completed; isNew; markedToDelete;

  constructor(obj) {
    this.name = obj.name;
    this.completed = obj.completed;
    this.isNew = obj.isNew;
    this.markedToDelete = obj.markedToDelete;
  }
}

class RecentItem {
  path; last; id; markedToDelete;

  constructor(obj) {
    this.path = obj.path;
    this.last = obj.last;
    this.id = obj.id;
  }
}

//arg parsing
////////////////////////

const reservedWords = [
  "-g", "--global",
  "-h", "--help",
  "--ignore",
  "-o",
  "init",
  "generate",
  "hub",
  "--sort",
  "-d", "--detailed"
];

let argument = [];
let command = "";
let config = [];

function setupArg() {
  argument = process.argv;
  argument.shift();
  argument.shift();

  command = argument[0];
  config = [...argument];
  config.shift();
}

setupArg();

// console.log(argument, command, config);

//initialData
////////////////////////

const initialData =
  "# Todo\n\nA basic todo markdown file\n\n" +
  "- [x] create a file\n\n" +
  "todo-cli: https://www.npmjs.com/package/@cicolas/todo-cli";

const globalData =
  "# Global Todo\n\nnThis is your global todo markdown file\n\n" +
  "- [x] create a file\n\n" +
  "todo-cli: https://www.npmjs.com/package/@cicolas/todo-cli";

//vars
////////////////////////

let basePath = process.cwd();
let title = "TODOS";
let description = "";
let todos = [];
let file = path.join(basePath, ".todo.md");
let fileData = "";
let linesArray = [];
let deleted = [];
let selected = 0;
let querrying = false;
let completeMode = true;
let recentFiles = [];
let fileMode = 'TODO';

let displayList = {
  'TODO': printTodos,
  'HUB': printHub
};

//command line 
////////////////////////

const isGlobal = argument.includes("-g") || argument.includes("--global");

if (isGlobal) {
  basePath = path.join(process.env.USERPROFILE, "/.todo-cli/");
}

const fileName = argument.filter(value => !reservedWords.includes(value))[0];
file = path.join(basePath, fileName ?? ".todo.md");

if (command === "-h" || command === "--help") {
  showHelp();
  process.exit();
}

if (argument.includes("generate")) {
  let _path = argument[argument.findIndex(value => value === "generate") + 1];
  if (reservedWords.includes(_path)) _path = null;
  if (_path) file = null;
  let realPath = path.join(basePath, _path ?? ".");

  // console.log("paths:", _path, file, realPath);

  if (process.platform === "win32" && _path?.search(/^[A-Z]:/) > -1)
    realPath = path.normalize(_path);

  if (argument.includes("--ignore")) generate.ignoreErrors();

  if (argument.includes("-o")) {
    let f = argument[argument.findIndex(value => value === "-o") + 1];
    if (reservedWords.includes(f)) f = null;

    if (!f) {
      console.log("no file passed to '".red + "-o".grey + "' argument".red);
      process.exit();
    }
    file = path.join(basePath, f);
  }

  const todos = generate.generate(realPath);

  if (todos.length <= 0) {
    console.log("0 todos was found in '".yellow + realPath.bold + "'".yellow);
    process.exit();
  }

  if (!file) file = path.join(basePath, ".todo.md");

  if (!fs.existsSync(file)) {
    initFile("", isGlobal ? globalData : initialData, file);
    console.log("file '".green + file.bold + "' created successfully".green);
  }

  try {
    fileData = fs.readFileSync(file, {
      encoding: "utf8",
      flag: "r",
    }).replace(/\r/g, "");
    linesArray = fileData.split("\n").filter(v => v !== "");
    linesArray = linesArray.filter(value =>
      (value.search(/- \[(x| )\] /) != -1)
    );
  } catch (e) {
    if (e.code === "EISDIR") {
      console.log("can't read a folder. Check if '".red + file.bold + "' is a folder".red);
      process.exit();
    }
  }

  for (let i = 0; i < linesArray.length; i++) {
    const v = linesArray[i];
    const value = v.substring(v.search(/\[/) + 1, v.search(/\]/));
    const name = v.substring(v.search(/\]/) + 2, v.length);
    addTodo(name, value == "x", false);
  }

  console.log(todos.length + " todos was found in '".green + realPath.bold + "'".green);
  todos.forEach(value => {
    const text = value[0] + ": " + value[1];
    if (addTodo(text, false, true)) console.log("- [ ] " + text);
  });

  saveTodo();
}

if (argument.includes("init")) {
  file = argument[argument.findIndex(value => value === "init") + 1];
  if (reservedWords.includes(file)) file = null;

  if (!fs.existsSync(file ?? ".todo.md")) {
    initFile('', isGlobal ? globalData : initialData, file ?? ".todo.md");
    console.log("file ".green + (file ?? ".todo.md").bold + " created!!!".green);
    process.exit();
  }
  console.log("file ".yellow + (file ?? ".todo.md").bold + " already exists".yellow);
  process.exit();
}

if (argument.includes("hub")) {
  fileMode = 'HUB';

  openRecentFile();
  if (argument.includes("--sort"))
    sortFiles();

  printHub();
}
//main
////////////////////////

//TODO: melhorar implementação do register 
function register(str, key) {
  if (querrying) {
    if (key.name === "return" && fileMode === "TODO") {
      createTodo();
      querrying = false;
    }

    return;
  }

  // console.log(key);
  // process.exit();
  if (key.ctrl) {
    if (key.name === "c") {
      if (fileMode === "HUB") writeRecentFile();
      else if (fileMode === "TODO") saveTodo();
    } else if (key.name === "up") {
      selected = 0;
      displayList[fileMode]();
    } else if (key.name === "down") {
      if (fileMode === "HUB") selected = recentFiles.length + 1;
      else if (fileMode === "TODO") selected = todos.length + 1;
      displayList[fileMode]();
    }

    return;
  }

  if (key.name === "up") {
    selected -= (selected - 1 < 0) ? 0 : 1;
    displayList[fileMode]();
  } else if (key.name === "down") {
    let limit = 0;
    if (fileMode === "HUB") limit += recentFiles.length + 1;
    if (fileMode === "TODO") limit = todos.length + 3;

    selected += selected + 1 > limit ? 0 : 1;
    displayList[fileMode]();
  } else if (key.name === "space" || key.name === "return" || key.name === "enter") {
    if (fileMode === "HUB") {
      const actions = [
        () => {
          writeRecentFile;
          process.exit();
        },
        () => {
          recentFiles = deleteMarked(recentFiles);
          printHub();
        },
      ];

      if (selected < recentFiles.length) {
        // todo: open with explore or todo-cli
        if (completeMode) { //open mode
          if (key.name === "enter") {
            const basename = path.dirname(recentFiles[selected].path);
            require("child_process").exec(
              `explorer.exe "${basename}"`
            );
          } else {
            file = recentFiles[selected].path;
            recentFiles.length = 0;
            setup();
            fileMode = "TODO";
          }
        }
        else {
          recentFiles[selected].markedToDelete = !recentFiles[selected].markedToDelete;
        }

        printHub();
      } else {
        actions[selected - recentFiles.length]();
      }
    } else if (fileMode === "TODO") {
      const actions = [
        createTodo,
        saveTodo,
        () => {
          todos = deleteMarked(todos);
          printTodos();
        },
        () => {
          todos = deleteCompleted();
          printTodos();
        },
      ];

      if (selected < todos.length) {
        if (completeMode)
          todos[selected].completed = !todos[selected].completed;
        else
          todos[selected].markedToDelete = !todos[selected].markedToDelete;
        printTodos();
      } else {
        actions[selected - todos.length]();
      }
    }
  } else if (key.name === "right" || key.name === "left") {
    completeMode = key.name === "left";
    displayList[fileMode]();
  }
}

async function initFile(pathName, initialD, name = ".todo.md") {
  if (!fs.existsSync(path.join(pathName))) {
    fs.mkdirSync(path.join(pathName) + "/");
  }

  fs.writeFileSync(
    path.join(pathName, name),
    initialD,
    (err) => {
      if (err) throw err;
    }
  );
}

function setup() {
  fs.readFile(file, function (err, data) {
    if (err) {
      cursor.show();
      if (err.code == "ENOENT") {
        console.log("file ".red + file.bold + " doesn't exist in this directory ".red);
        process.exit();
      }
      throw err;
    }

    openRecentFile();
    addFileToRecent();
    // manipulacao do historico
    if (fileMode === "TODO") {
      writeRecentFile();
    }

    fileData = data.toString();
    fileData = fileData.replace(/\r/g, "");
    linesArray = fileData.split("\n").filter(v => v !== "");

    title = linesArray[0].replace("#", "").trim();
    description = linesArray[1].trim();

    linesArray = linesArray.filter(value =>
      (value.search(/- \[(x| )\] /) != -1)
    );

    for (let i = 0; i < linesArray.length; i++) {
      const v = linesArray[i];
      const value = v.substring(v.search(/\[/) + 1, v.search(/\]/));
      const name = v.substring(v.search(/\]/) + 2, v.length);
      addTodo(name, value == "x" ? true : false);
    }
    printTodos();
  });
}

function convertTodo(t) {
  const vv = t.substring(t.search(/\[/) + 1, t.search(/\]/));
  let n = t.substring(t.search(/\]/) + 2, t.length);
  const a = { name: n, completed: vv == "x" ? true : false, isNew: false };
  return a;
}

function saveTodo() {
  for (let i = 0; i < todos.length; i++) {
    const v = todos[i];

    const a = `- [${v.completed ? "x" : " "}] ${v.name}`;

    if (v.isNew) {
      fileData += "\n" + a;
      v.isNew = false;
    } else {
      for (let i = 0; i < linesArray.length; i++) {
        const value = linesArray[i];
        if (convertTodo(value).name === v.name && !(deleted.find(x => x.name === convertTodo(value).name))) {
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
        if (convertTodo(value).name === v.name) {
          fileData = fileData.replace("\n" + value, "");
        }
      }
    }
  }

  fs.writeFile(file, fileData, function (err) {
    if (err) return console.log(err);

    cursor.show();
    process.exit();
  });
}

function printTodos() {
  console.clear();
  console.log(`---${title}---\n`.rainbow);
  if (description)
    console.log(`${description}\n`.white);

  let mode =
    "[".gray +
    (completeMode ? "complete".green : "complete".gray) +
    "-".gray +
    (completeMode ? "delete".gray : "delete".red.bold.underline) +
    "]".gray;
  console.log(`${mode}`);

  for (const v in todos) {
    if (todos[v] instanceof TodoItem) {
      let a = `[${todos[v].completed ? "x" : " "}] ${todos[v].name}`;
      a = v == selected ? a.bold : a;

      if (todos[v].markedToDelete)
        a = a.red;
      else if (todos[v].completed)
        a = a.green;

      console.log(`${v == selected ? ">" : "-"} `.white + a);
    }
  }

  let create = `create a new `.grey + 'todo'.blue.underline;
  create = selected == todos.length ? create.bold : create;
  console.log(`${selected == todos.length ? "> " : ""}`.white + create);

  let save = 'save and '.grey + 'exit'.red;
  save = selected == todos.length + 1 ? save.bold : save;
  console.log(`${selected == todos.length + 1 ? "> " : ""}`.white + save);

  let deleteM = 'delete'.red + ' all marked '.gray;
  deleteM = selected == todos.length + 2 ? deleteM.bold : deleteM;
  console.log(`${selected == todos.length + 2 ? "> " : ""}`.white + deleteM);

  let deleteC = ' delete completed ';
  deleteC = selected == todos.length + 3 ? deleteC.bgRed.bold.white : deleteC.black.bgBlack;
  console.log(`${selected == todos.length + 3 ? "> " : ""}`.white + deleteC);
}

function printHub() {
  const shortPath = (pathstr) => {
    const { base, dir, root } = path.parse(pathstr);
    const lastFolder = path.basename(dir);

    return path.join(root, '...', lastFolder, base);
  };

  console.clear();
  console.log(`---HUB---\n`.rainbow);
  console.log(`Arquivos de Todos acessados recentemente\n`.white);

  let mode =
    "[".gray +
    (completeMode ? "open".blue : "open".gray) +
    "-".gray +
    (completeMode ? "delete".gray : "delete".red.bold.underline) +
    "]".gray;
  console.log(`${mode}`);

  for (const item of recentFiles) {
    if (item instanceof RecentItem) {
      const date = new Date(item.last);
      let a = `${item.id + 1}.\t` + date.toDateString().grey + "\t";
      let path = selected === item.id ? item.path : shortPath(item.path);

      a = item.id == selected ? a.bold : a;
      path = item.id == selected ? path.bold : path;

      if (item.markedToDelete) {
        a = a.red;
        path = path.red;
      }

      console.log(`${item.id == selected ? ">" : "-"} `.white + a + path);
    }
  }

  let save = 'save and '.grey + 'exit'.red;
  save = selected == recentFiles.length ? save.bold : save;
  console.log(`${selected == recentFiles.length ? "> " : ""}`.white + save);

  let deleteM = 'delete'.red + ' all marked '.gray;
  deleteM = selected == recentFiles.length + 1 ? deleteM.bold : deleteM;
  console.log(`${selected == recentFiles.length + 1 ? "> " : ""}`.white + deleteM);
}

function addTodo(n, c = false, _isNew = false) {
  if (todos.find(value => value.name === n) && _isNew) {
    console.log("todo ".yellow + n + " already exists".yellow);
    return false;
  }

  const newTodo = new TodoItem({ name: n, completed: c, isNew: _isNew, markedToDelete: false });

  todos.push(newTodo);
  return true;
}

function createTodo() {
  if (!querrying) {
    cursor.show();
    printTodos();
    querrying = true;
    let str = "";

    a.question(" add todo name \n".bgWhite.black, (e) => {
      console.log(e);
      str = e;
      addTodo(str, false, true);
      printTodos();
      cursor.hide();
    });
  }
}

function deleteMarked(arr) {
  if (fileMode === "TODO")
    deleted = arr.filter(v => v.markedToDelete);
  arr = arr.filter(v => !v.markedToDelete);
  selected = 0;
  return arr;
}

function deleteCompleted(arr) {
  if (fileMode === "TODO")
    deleted = arr.filter(v => v.completed);
  arr = arr.filter(v => !v.completed);
  selected = 0;
  return arr;
}

function showHelp() {
  const helpMsg =
    "---Todo-CLI---\n\n".rainbow +
    "todo-cli is a command line software to create and manage your daily project tasks\n\n".white +
    "usage guide:\n".grey +
    "todo <relative-path> " + "[-g]\t\t" + "open the given file (default: " + "'./.todo.md'".blue.bold + ")\n\n" +
    "todo init <relative-path> " + "[-g]\t\t" + "create a todo-cli .md file (default: " + "'./.todo.md'".blue.bold + ")\n\n" +
    "[BETA]\n".grey +
    "todo generate <relative-path> " + "[-g, -o,\t" + "generate a todo by getting all " + "'\/\/TODO :'".yellow + " in files of given directory\n" +
    "                              " + " --ignore]\n\n" +
    "todo hub " + "\t\t\t\topen a list of all your recents todos files\n\n" +
    "flags:\n".grey +
    "-g/--global                           \t" + "use global path " + "'~/.todo-cli/'".green + " instead of default\n" +
    "-o <path>                             \t" + "use to set the output file (default: " + "'./.todo.md'".blue.bold + ")\n" +
    "--ignore                              \t" + "ignore 'todo generate' errors while reading files\n";

  console.log(helpMsg);
}

function openRecentFile() {
  recentFiles = [];
  const recentJSON = JSON.parse(
    fs.readFileSync(path.join(__dirname, "./recent.json"), {
      encoding: "utf8",
      flag: "r",
    })
  );

  for (const i in recentJSON) {
    if (recentJSON[i].path && recentJSON[i].last) {
      const recentObj = new RecentItem({
        id: +i,
        path: recentJSON[i].path,
        last: recentJSON[i].last
      });
      recentFiles.push(recentObj);
    }
  }
}

function writeRecentFile() {
  fs.writeFileSync(
    path.join(__dirname, "./recent.json"),
    JSON.stringify(recentFiles), {
    encoding: "utf8",
    flag: "w",
  }
  );
}

function addFileToRecent() {
  recentFiles = recentFiles.filter(f => f.path !== file);

  recentFiles.unshift({
    path: file,
    last: Date.now()
  });
}

function sortFiles() {
  let arr = new Array();

  for (const rFile of recentFiles) {
    arr = sortingRecentList(arr, rFile);
  }

  console.log(arr);
}

/**
 * 
 * @param {{path: string, last: number}[]} arr 
 * @param {{path: string, last: number}} file 
 */
function sortingRecentList(arr, f) {
  const dateCompare = (d1, d2) => {
    if (d1 == d2) return 0;
    return (d1 > d2) ? 1 : -1;
  };

  for (let i = 0; i < arr.length; i++) {
    const cmp = dateCompare(arr[i].last, f.last);

    if (cmp != -1) {
      arr.insert(i, f);
      return arr;
    }
  }

  arr.push(f);
  return arr;
}

if (fileMode == "TODO") {
  setup();
}
process.stdin.on('keypress', register);
