const path = require('path')
const fs = require('fs');

const ignoreErrors = false;
const todos = []
const todoIgnore = fs.readFileSync(path.join(__dirname, ".todoignore"), {
    encoding: "utf8",
    flag: "r",
}).replace(/\r/g, "").split("\n")

//TODO: add folder path to file
function getAllInFolder(staticPath){
    const files = {
        type: "folder",
        path: path.normalize(staticPath),
        files: []
    }
    
    fs.readdirSync(staticPath, { withFileTypes: true }).forEach(
        (_file) => {
            const file = _file.name;
            if (!checkIgnore(staticPath, file)) {
                if (_file.isFile()) {
                    try{
                        files.files.push({
                            type: "file",
                            name: file,
                            data: fs.readFileSync(path.join(staticPath, file), {
                                encoding: "utf8",
                                flag: "r",
                            }),
                        });
                    } catch(e) {
                        if (ignoreErrors) console.log(e.code.yellow + file.bold);
                        else throw e
                    }
                }else {
                    files.files.push(getAllInFolder(path.join(staticPath, file)));
                }
            }
        }
    )

    return files;
}

function getAllTodoInFolder(obj) {
    if (obj.type === "folder")
        obj.files.forEach((value) => {
            getAllTodoInFolder(value, obj.path);
        });

    if (obj.type === "file") {
        // console.log(obj.name, filterAllTodo(obj.data));
        filterAllTodo(obj.data)?.forEach(value => todos.push([obj.name, value]));
    }
}

//TODO: add line number
function filterAllTodo(data) {
    return data
        .match(/(T|t)(O|o)(D|d)(O|o):.*/g)
        ?.map((value) => value.substring(5, value.length).trim());
}

//TODO: check the type of file
function checkIgnore(_path, name) {
    if (todoIgnore.includes(name)) return true;

    const fullPath = path.join(_path, name);
    const basePath = path.join(__dirname, "../../");
    const basePathParts = basePath.split(path.sep);
    const pathParts = fullPath
        .split(path.sep)
        .filter((value) => !basePathParts.includes(value))
        .map((value) => value + '/');
    pathParts.pop()

    for (let i = 0; i < pathParts.length; i++) {
        const value = pathParts[i]
        return todoIgnore.includes(value);
    }
}

module.exports = {
    ignoreErrors: () => {
        ignoreErrors = true;
    },
    generate: (_path) => {
        getAllTodoInFolder(getAllInFolder(_path));
        return todos;
    }
}