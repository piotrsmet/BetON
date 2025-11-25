import pkg from "mysql2"

const mysql = pkg.default || pkg;

const pool = mysql.createPool({
	host: 'localhost',         
	user: 'smecik',         
	password: 'zaq1@WSX', 
	database: 'BetON', 
	waitForConnections: true,
	connectionLimit: 10,       
	queueLimit: 0             
});


const promisePool = pool.promise();


export default promisePool