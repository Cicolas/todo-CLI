const path = require('path')
const fs = require('fs');

const todos = []
const todoIgnore = fs.readFileSync(path.join(__dirname, ".todoignore"), {
    encoding: "utf8",
    flag: "r",
}).replace(/\r/g, "").split("\n")

function getAllInFolder(staticPath){
    const files = {
        type: "folder",
        path: path.normalize(staticPath),
        files: []
    }

    fs.readdirSync(staticPath).forEach(
        (file) => {
            if (!checkIgnore(staticPath, file)) {
                if (file.indexOf(".") > -1) {
                    try{
                        files.files.push({
                            type: "file",
                            name: file,
                            data: fs.readFileSync(path.join(staticPath, file), {
                                encoding: "utf8",
                                flag: "r",
                            }),
                        });
                    } catch(e ) {
                        if (e.code === "EISDIR") {
                            console.log("file ".yellow + file.bold + " read permission denied ".yellow);
                        }else{
                            throw e
                        }
                        return
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
        filterAllTodo(obj.data)?.forEach(value => todos.push(value));
    }
}

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

    pathParts.forEach(value => {
        return todoIgnore.includes(value);
    })
}

module.exports = {
    generate: (_path) => {
        getAllTodoInFolder(getAllInFolder(_path));
        return todos;
    }
}