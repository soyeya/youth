const mysql = require('mysql2');

const db = mysql.createPool({
    host : "127.0.0.1",
    user : "root",
    password : "wlfkfgksp!!55",
    database : "youth",
    waitForConnections: true
})


const dataTable = {
    db,
}

module.exports = { dataTable }