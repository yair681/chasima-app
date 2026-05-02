const jwt = require('jsonwebtoken');

module.exports = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No token'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Each user joins their own room so server can target them directly
    socket.join(`user:${socket.user.id}`);
    console.log(`[socket] ${socket.user.role} ${socket.user.name} connected`);

    socket.on('disconnect', () => {
      console.log(`[socket] ${socket.user.name} disconnected`);
    });
  });
};
