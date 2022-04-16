const database = require("better-sqlite3")

const logdb = new database('log.db')

const stmt = logdb.prepare(`SELECT name from sqlite_master WHERE type='table' and name='accesslog';`)
let row = stmt.get();
if (row === undefined){   //check exist? If not, create a table
    console.log("Log database missing. Create log database.")

    const sqlInit = `
        CREATE TABLE accesslog ( id INTEGER PRIMARY KEY, remoteaddr TEXT, remoteuser TEXT, time TEXT, method TEXT, url TEXT, protocol TEXT, httpversion TEXT, status TEXT, referer TEXT, useragent TEXT);
    `
    logdb.exec(sqlInit)
}
else{
    console.log('Log database exists')
}

module.exports = logdb    //export as a common modlue named lgdb
