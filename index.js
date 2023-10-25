const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { exec } = require('child_process');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let childProcess; // Store the child process for the started server

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
  console.log('A user connected');

  // Listen for start command
  socket.on('start', () => {
    // Replace this with your server start logic
    if (!childProcess) {
      const serverCode = `console.log('hello')`; //Edit this code

      childProcess = exec(`node -e "${serverCode}"`);

      childProcess.stdout.on('data', (data) => {
        io.emit('update', data);
      });

      childProcess.stderr.on('data', (data) => {
        io.emit('update', data);
      });

      childProcess.on('close', (code) => {
        io.emit('update', `Server process exited with code ${code}`);
        childProcess = null; // Reset the child process variable
      });

      io.emit('update', 'Starting the server...');
    } else {
      io.emit('update', 'Server is already running');
    }
  });

  // Listen for stop command
  socket.on('stop', () => {
    // Replace this with your server stop logic
    if (childProcess) {
      childProcess.kill(); // Kill the running server process
      io.emit('update', 'Stopping the server...');
    } else {
      io.emit('update', 'No server running to stop');
    }
  });

  // Listen for execute command
  socket.on('execute', (command) => {
    // Execute the command and emit updates
    const process = exec(command);

    process.stdout.on('data', (data) => {
      io.emit('update', data);
    });

    process.stderr.on('data', (data) => {
      io.emit('update', data);
    });

    process.on('close', (code) => {
      io.emit('update', `Command exited with code ${code}`);
    });
  });

  // Disconnect event
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
