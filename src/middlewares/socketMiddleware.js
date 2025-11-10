// Middleware para pasar io (Socket.IO) a los routers
export const socketMiddleware = (io) => {
    return (req, res, next) => {
        req.io = io;
        next();
    };
};
