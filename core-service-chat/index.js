const express = require('express');
const mysql = require('mysql');
const app = express();
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
require("dotenv").config({ path: "./../.env" });
const server = http.createServer(app);
const io = socketIo(server);

const users = {};
app.use(express.static(__dirname));
app.use(express.json())
const JWT_SECRET = process.env.JWT_SECRET ||'xyz7#ndsd8@';
console.log("process.env.MYSQL_HOST----->",process.env.MYSQL_HOST);
const connection = mysql.createPool({
	connectionLimit: 10,
	host: process.env.MYSQL_HOST ||'3.25.224.213',
	user: process.env.MYSQL_USER || 'root',
	password: process.env.MYSQL_PASSWORD || 'password',
	database: process.env.MYSQL_DATABASE || 'test'
});
connection.on('error', (err) => {
    console.error('MySQL connection error:', err);
});

connection.getConnection((err, conn) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err);
    } else {
        console.log('Connected-----');
        conn.release();
    }
});



app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get("/health", (req, res) => {
    res.status(200).json({ message: "Everything is good here" });
  });
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
};

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        console.log(" username, password----->", username, password);
        connection.query('SELECT * FROM User WHERE username = ? AND passwords = ?', [username, password], async (error, results, fields) => {
            if (error) {
                console.error('Error querying MySQL:', error);
                return res.status(500).send('Internal Server Error');
            }

            if (results.length === 0 ) {
                return res.status(401).send('Unauthorized');
            }

            const token = jwt.sign({ username: username }, JWT_SECRET);
            res.json({ token });
        });
    } catch (error) {
        console.error( error.message);
        res.status(500).send('Internal Server Error');
    }
});

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    const decoded = verifyToken(token);
    if (decoded) {
        socket.user = decoded.username;
        next();
    } else {
        next(new Error('error'));
    }
});


io.on('connection', (socket) => {
    console.log('user connect');

    socket.on('join', (username, room) => {
        users[socket.id] = { username, room };
        socket.join(room);
        socket.to(room).emit('chat message', `${username} has joine`);
    });

    socket.on('chat message', (msg) => {
        const user = users[socket.id];
        io.to(user.room).emit('chat message', `${user.username}: ${msg}`);
    });

    socket.on('disconnect', () => {
        const user = users[socket.id];
        if (user) {
            io.to(user.room).emit('chat message', `${user.username} has left `);
            delete users[socket.id];
        }
    });
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

