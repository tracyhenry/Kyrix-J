const fs = require("fs");
const {exec} = require("child_process");

function formatSQL(query) {
    query = query.toLowerCase();
    let keywords = ["select", "from", "group by"];
    keywords.forEach(kw => {
        let p = query.indexOf(kw);
        if (p > 0) query = query.substring(0, p) + "\n" + query.substring(p);
        query = query.replace(kw, kw.toUpperCase());
    });
    return query;
}

function writeJSON(json, file) {
    fs.writeFile(file, JSON.stringify(json), () => {});
    exec(
        `prettier --no-bracket-spacing --tab-width 4 --end-of-line \"lf\" --write ${file}`,
        (err, stdout, stderr) => {
            if (err) {
                throw err;
                return;
            }
        }
    );
}

module.exports = {
    formatSQL,
    writeJSON
};
