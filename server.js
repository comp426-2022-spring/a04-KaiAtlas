const express = require('express')
const app = express()
app.use(express.urlencoded({extended:true}))
app.use(express.json())

const morgan = require('morgan')
// let logging = app.use(morgan('combined'))

const fs = require('fs')

const logdb = require('./database')
const { networkInterfaces } = require('os')

const args = require("minimist")(process.argv.slice(2))
const port = args.port || 5555

const help = (`
server.js [options]

--port	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.

--debug	If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.

--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.

--help	Return this message and exit.
`)
// If --help or -h, echo help text to STDOUT and exit
if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}

app.use((req, res, next)=>{
  let logdata = {
    remoteaddr: req.ip,
    remoteuser: req.user,
    time: Date.now(),
    method: req.method,
    url: req.url,
    protocol: req.protocol,
    httpversion: req.httpVersion,
    status: res.statusCode,
    referer: req.headers['referer'],
    useragent: req.headers['user-agent']
  }
  const stmt = logdb.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referer, logdata.useragent)
  next()
})

const server =  app.listen(port,() =>{
    console.log('App is running on port %PORT%'.replace('%PORT%', port))
})

app.get('/app/', (req, res) =>{
  res.statusCode = 200;
  res.statusMessage = 'OK';
  res.writeHead( res.statusCode, { 'Content-Type' : 'text/plain' });
  res.end(res.statusCode+ ' ' +res.statusMessage)
})

if (args.debug == 'true'){
  app.get("/app/log/access", (req, res)=>{
    const stmt = logdb.prepare('SELECT *FROM accesslog').all()    //give you all the record, use get() to select
    res.status(200).json(stmt)
  })

  app.get("/app/error", (req, res)=>{
    throw new Error("Error test successful")
  })

}

if (args.log == "true" || args.log == null){
  const accessLog = fs.createWriteStream('access.log', {flags:'a'})
  app.use(morgan('combined', {stream:accessLog}))
}



// app.post("/app/new/user", (req, res, next)=>{    //create something using post
//   let data = {
//     user: req.body.username,
//     pass: req.body.password
//   }
//   const stmt = logdb.prepare('INSERT INTO userinfo (username, password) VALUES (?, ?)')
//   const info = stmt.run(data.user, data.pass)
//   res.status(200).json(info)
// })

// app.get("/app/user/:id", (req, res)=>{
//   try {
//     const stmt = logdb.prepare(`SELECT * FROM userinfo WHERE id = ?`).get(req.params.id)
//     res.status(200).json(stmt)
//   }
//   catch(e){
//     console.error(e)
//   }
// })

// app.get("/app/users", (req, res)=>{
//   try{
//     const stmt = logdb.prepare('SELECT *FROM userinfo').all()    //give you all the record, use get() to select
//     res.status(200).json(stmt)
//   }
//   catch{
//     console.error(e)
//   }
// })

// app.delete("/app/delete/user/:id", (req, res)=>{
//   const stmt = logdb.prepare('DELETE FROM userinfo WHERE id = ?')
//   const info = stmt.run(req.params.id)
//   res.status(200).json(info)
// })

// app.patch("/app/update/user/:id", (req, res)=>{
//   let data = {
//     user: req.body.username,
//     pass: req.body.password
//   }
//   const stmt = logdb.prepare('UPDATE userinfo SET username = COALESCE(?, username), password = COALESCE(?, password) WHERE id = ?')
//   const info = stmt.run(data.user, data.pass, req.params.id)
//   res.status(200).json(info)
// })


function coinFlip() {
    let flip = Math.random();
    let result = '';
    if (flip<0.5){
      result = 'heads'
    }
    else{
      result = 'tails'
    }
    return result;
}

app.get('/app/flip/', (req, res) =>{
    res.status(200).json({'flip':coinFlip()})
})

function FlipsNew(flips) {
    const array = [];
    for (let i = 0; i<flips; i++){
      array[i] = coinFlip();
    }
    let Hnum = 0;
    let Tnum = 0;
    for (let i = 0; i<array.length; i++){
      if (array[i].localeCompare('heads') == 0){
        Hnum ++;
      }
      else{
        Tnum ++;
      }
    }
    return {"raw":array, "summary":{tails:Tnum,heads: Hnum}};
}

app.get('/app/flips/:number', (req, res)=>{
    res.status(200).json(FlipsNew(req.params.number))
})

function flipACoin(call) {
    let result = '';
    let oneFlip = coinFlip();
    if (oneFlip.localeCompare(call) == 0){
      result = 'win';
    }
    else{
      result = 'lose';
    }
    return {call:call, flip: oneFlip, result: result};
}

app.get('/app/flip/call/:guess', (req, res) =>{
    res.status(200).json(flipACoin(req.params.guess))
})


app.use(function(req,res){
    res.status(404).send('404 Not found')
})

