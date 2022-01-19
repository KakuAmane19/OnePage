const users = require('../models/Users');
const { ENTER_EVENT, ACCEPT_EVENT, ENTER_RETRY_EVENT, ENTERED_EVENT, REACTION_EVENT, CLEAR_COUNT_EVENT, LEAVE_EVENT, LEFT_EVENT, ERROR_EVENT } = require('./events');

let reactionsCount = {};

module.exports = (http) => {
    const io = require('socket.io')(http);

    io.on('connection', socket => {
        console.log(`ID=${socket.id} USERAGENT=${socket.request.headers['user-agent']}: a user connected`);
        socket.on(ENTER_EVENT, msg => {
            if (!Object.keys(msg).includes('name', 'room')) {
                console.error(`ID=${socket.id}: not included name and room`);
                socket.emit(ERROR_EVENT, 'not included name and room');
                return;
            }
            if (users.isExistUser(null, msg.name, msg.room)) {
                console.info(`ID=${socket.id} NAME=${msg.name}: same name user exist`);
                const leftUser = users.getUser(null, msg.name, msg.room);
                console.log(leftUser);
                socket.to(msg.room).emit(LEFT_EVENT, {
                    name: leftUser.name,
                    id: leftUser.id
                });
                socket.emit(ENTER_RETRY_EVENT);
            } else {
                const participants = users.getUsers(msg.room);
                if (!participants) {
                    console.error(`ID=${socket.id} ROOM=${msg.room}: Users not found`);
                    socket.emit(ERROR_EVENT, `Users not found Room: ${msg.room}`);
                    return;
                }
                console.log(`ID=${socket.id} ROOM=${msg.room} NAME=${msg.name}: accept new user`);

                if (!reactionsCount[msg.room]) {
                    reactionsCount[msg.room] = 0;
                }

                const participantsCount = participants.length + 1;
                socket.to(msg.room).emit(ENTERED_EVENT, {
                    name: msg.name,
                    id: socket.id,
                    participantscount: participantsCount
                });
                socket.emit(ACCEPT_EVENT, {
                    name: msg.name,
                    userlist: users.getUsers(msg.room),
                    reactionscount: reactionsCount[msg.room],
                    participantscount: participantsCount
                });
                socket.join(msg.room);
                users.addUser(socket.id, msg.name, msg.room);
            }
        });
        socket.on(REACTION_EVENT, msg => {
            if (msg.reaction === 'raiseHand') {
                reactionsCount[msg.room]++;
            }
            msg.reactionscount = reactionsCount[msg.room];
            socket.to(msg.room).emit(REACTION_EVENT, msg);
        });
        socket.on(CLEAR_COUNT_EVENT, msg => {
            reactionsCount[msg.room] = 0;
            socket.to(msg.room).emit(CLEAR_COUNT_EVENT);
        });
        socket.on(LEAVE_EVENT, msg => {
            const deleteUser = users.getUser(msg.id);
            if (!deleteUser) {
                console.error(`ID=${msg.id}: User not found`);
                return;
            }
            const participants = users.getUsers(msg.room);
            if (!participants) {
                console.error(`ROOM=${msg.room}: Users not found`);
                return;
            }
            const participantsCount = participants.length - 1;
            socket.to(msg.room).emit(LEFT_EVENT, {
                name: deleteUser.name,
                id: deleteUser.id,
                participantscount: participantsCount
            });
            socket.emit(LEFT_EVENT, {
                name: deleteUser.name,
                id: deleteUser.id,
                participantscount: participantsCount
            });
            users.deleteUser(msg.id);
            if (participantsCount === 0) {
                reactionsCount[msg.room] = 0;
            }
        });

        socket.on('disconnect', reason => {
            console.info(`ID=${socket.id}: ${reason}`);
            const leftUser = users.getUser(socket.id);
            let participantsCount = 0;
            if (leftUser) {
                participantsCount = users.getUsers(leftUser.room).length - 1;
                users.deleteUser(socket.id);
                socket.to(leftUser.room).emit(LEFT_EVENT, {
                    name: leftUser.name,
                    id: leftUser.id,
                    participantscount: participantsCount
                });
                socket.leaveAll();
                if (participantsCount === 0 && reactionsCount[leftUser.room]) {
                    delete reactionsCount[leftUser.room];
                }
            }
        });
        socket.on('error', err => {
            console.error(`ID=${socket.id}: ${err}`);
        });
    });
};