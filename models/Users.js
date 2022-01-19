const lowdb = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const db = lowdb(adapter);

db.defaults({ users: [] }).write();

const isExistUser = (id, name, room) => {
    if (!room) {
        console.error('Set room');
        return false;
    }
    if (id) {
        return (db.get('users').value().findIndex(u => u.id === id) !== -1);
    } else if (name) {
        return (db.get('users').value().findIndex(u => u.name === name && u.room === room) !== -1);
    } else {
        console.error('Set id or name');
        return false;
    }
}

const getUser = (id, name, room) => {
    if (id) {
        return db.get('users').find(u => u.id === id).value();
    } else if (name && room) {
        return db.get('users').find(u => u.name === name && u.room === room).value();
    } else {
        console.error('argument error');
        return;
    }
};

const getUsers = (room) => {
    if (!room) {
        console.error('Set room');
        return;
    }
    return db.get('users').filter(u => u.room === room).value();
};

const addUser = (id, name, room) => {
    if (!room || room === '') {
        console.error('Room is empty');
        return;
    }
    if (!id || id === '') {
        console.error('ID is empty');
        return;
    }
    if (!name || name === '') {
        console.error('User name is empty');
        return;
    }

    db.get('users').push({
        id: id,
        name: name,
        room: room
    }).write();
};

const deleteUser = (id) => {
    if (!id) {
        console.error('Set ID');
    }
    db.get('users').remove({ id: id }).write();
};

const clearUsers = () => {
    db.set('users', []);
};

module.exports = {
    isExistUser,
    getUser,
    getUsers,
    addUser,
    deleteUser,
    clearUsers
};