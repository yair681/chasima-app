require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// Attach io to every request so routes can emit events
app.use((req, _res, next) => { req.io = io; next(); });

app.use('/api/auth',       require('./routes/auth'));
app.use('/api/children',   require('./routes/children'));
app.use('/api/tasks',      require('./routes/tasks'));
app.use('/api/screentime', require('./routes/screentime'));
app.use('/api/rewards',    require('./routes/rewards'));

app.get('/health', (_req, res) => res.json({ ok: true }));

require('./socket')(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
