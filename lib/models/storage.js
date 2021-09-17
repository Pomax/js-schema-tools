const BUFFER = [];

// This will work in Node, and will leave "fs" a noop with warnings in the browser
let fs = {
  readFile: function (path) {
    return new Promise((resolve, reject) => {
        BUFFER.push({ fn: `readFile`, path });
    })
  },
  writeFile: function (path, data) {
    BUFFER.push({ fn: `writeFile`, path, data });
  },
};


const Storage = {
    fs: {
        readFile: function (path) {
            return fs.readFile(path);
        },
        writeFile: function (path, data) {
            return fs.writeFile(path);
        },
    }
};

export default Storage;


function bindFS(lib) {
    fs = lib.promises;
    BUFFER.forEach(async(call) => await fs[call.fn](call.path, call.data));
}

import("fs").then((api) => bindFS(api));
