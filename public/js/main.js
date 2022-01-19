const ENTER_EVENT = 'ENTER_EVENT';
const ACCEPT_EVENT = 'ACCEPT_EVENT';
const ENTER_RETRY_EVENT = 'ENTER_RETRY_EVENT';
const ENTERED_EVENT = 'ENTERED_EVENT';
const REACTION_EVENT = 'REACTION_EVENT';
const CLEAR_COUNT_EVENT = 'CLEAR_COUNT_EVENT';
const LEAVE_EVENT = 'LEAVE_EVENT';
const LEFT_EVENT = 'LEFT_EVENT';
const ERROR_EVENT = 'ERROR_EVENT';

(async () => {
    const heartbeat = document.getElementById('heartbeat');
    const goodButton = document.getElementById('good-button');
    const badButton = document.getElementById('bad-button');
    const handButton = document.getElementById('hand-button');
    const handRaiseButton = document.getElementById('hand-raise-button');
    const handLowerButton = document.getElementById('hand-lower-button');
    const myReaction = document.getElementById('my-reaction');
    const roomName = document.getElementById('room-name');
    const userName = document.getElementById('user-name');
    const participantsCount = document.getElementById('participants-count');
    const reactionsCount = document.getElementById('reactions-count');
    const clearCountButton = document.getElementById('clear-count-button');
    const usersSelect = document.getElementById('users-select');
    const userLeaveButton = document.getElementById('user-leave-button');
    const userList = document.getElementById('user-list');
    let timerList = {};

    let isRetried = false;

    const postError = message => {
        fetch('/api/error', {
            method: 'post',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message)
        });
    };

    const onClickReactionButton = (reaction = 'hand', name) => {
        if (!name) {
            console.error('name is not set');
            return;
        }
        socket.emit(REACTION_EVENT, {
            name: name,
            reaction: reaction,
            id: socket.id,
            room: roomNameText
        });

        let reactionIcon = 'fas fa-user';
        switch (reaction) {
            case 'good': reactionIcon = 'fas fa-thumbs-up update-reaction'; break;
            case 'bad': reactionIcon = 'fas fa-thumbs-down update-reaction'; break;
            case 'hand': reactionIcon = 'fas fa-hand-paper update-reaction'; break;
            case 'raiseHand': reactionIcon = 'fas fa-hand-paper update-reaction'; break;
            case 'lowerHand': reactionIcon = 'fas fa-user'; break;
            default: break;
        }
        const myReactionIcon = document.createElement('i');
        myReactionIcon.className = `${reactionIcon} fa-5x`;
        myReaction.children[0].remove();
        myReaction.appendChild(myReactionIcon);

        if (reaction === 'raiseHand' || reaction === 'lowerHand') {
            return;
        } else {
            if (timerList[name]) {
                clearTimeout(timerList[name]);
            }
            timerList[name] = setTimeout(() => {
                const newReactionElm = document.createElement('i');
                newReactionElm.className = 'fas fa-user fa-5x';
                myReaction.children[0].remove();
                myReaction.appendChild(newReactionElm);
            }, 5000);
        }
    };
    const getParam = () => {
        let param = [];
        location.search.replace('?', '').split('&').forEach(s => {
            const k = s.split('=')[0];
            const v = s.split('=')[1];
            param[k] = v;
        });
        return param;
    };
    const param = getParam();

    const socket = io();

    let roomNameText = '';

    if (!param.room) {
        roomNameText = (await Swal.fire({
            title: 'ルーム名を入力してください',
            input: 'text',
            allowOutsideClick: false,
            allowEscapeKey: false,
            inputValidator: value => {
                if (!value) {
                    return 'ルーム名を入力してください'
                }
            }
        })).value;
    } else {
        roomNameText = param.room;
    }

    const storedUserNameText = localStorage.getItem(`${roomNameText}-name`);
    let userNameText = '';
    if (!storedUserNameText) {
        userNameText = (await Swal.fire({
            title: 'ユーザー名を入力してください',
            input: 'text',
            allowOutsideClick: false,
            allowEscapeKey: false,
            inputValidator: value => {
                if (!value) {
                    return 'ユーザー名を入力してください'
                }
            }
        })).value;
        localStorage.setItem(`${roomNameText}-name`, userNameText);
    } else {
        userNameText = storedUserNameText;
    }

    socket.emit(ENTER_EVENT, {
        name: userNameText,
        room: roomNameText
    });

    socket.on(ACCEPT_EVENT, msg => {
        history.replaceState('', '', `${location.origin}?room=${roomNameText}`);
        const elm = document.createElement('i');
        elm.className = 'fas fa-heartbeat fa-2x heartbeat-online';
        heartbeat.textContent = null;
        heartbeat.appendChild(elm);
        reactionsCount.innerText = `挙手の数: ${msg.reactionscount}`;
        roomName.innerText = `${roomNameText}`;
        userName.innerText = `ユーザー名: ${userNameText}`;
        participantsCount.innerText = `現在の参加者: ${msg.participantscount}人`;
        usersSelect.textContent = null;
        msg.userlist.forEach(u => {
            const newUserItemElmDiv = document.createElement('div');
            newUserItemElmDiv.className = 'column is-1-desktop is-2-tablet is-3-mobile user-list-item';
            newUserItemElmDiv.id = `user-${u.id}-item`;
            const newUserItemElmP = document.createElement('p');
            newUserItemElmP.innerText = u.name;
            const newUserItemElmI = document.createElement('i');
            newUserItemElmI.className = 'fas fa-user fa-2x';
            newUserItemElmI.id = `user-${u.id}-reaction`;
            newUserItemElmDiv.appendChild(newUserItemElmP);
            newUserItemElmDiv.appendChild(newUserItemElmI);
            userList.appendChild(newUserItemElmDiv);

            const opt = document.createElement('option');
            opt.innerText = u.name;
            opt.value = u.id;
            usersSelect.appendChild(opt);
        });
    });
    socket.on(ENTER_RETRY_EVENT, () => {
        if (isRetried) {
            console.error('cannot enter');
            postError({
                message: 'cannot enter',
                id: socket.id
            });
            Swal.fire('セッションに参加できませんでした', '同名ユーザーの追い出しができませんでした', 'error');
            return;
        }
        setTimeout(() => {
            isRetried = true;
            socket.emit(ENTER_EVENT, {
                name: userNameText,
                room: roomNameText
            });
        }, 500);
    });
    socket.on(ENTERED_EVENT, msg => {
        console.log(msg.name);
        participantsCount.innerText = `現在の参加者: ${msg.participantscount}人`;
        const newUserItemElmDiv = document.createElement('div');
        newUserItemElmDiv.className = 'column is-1-desktop is-2-tablet is-3-mobile user-list-item';
        newUserItemElmDiv.id = `user-${msg.id}-item`;
        const newUserItemElmP = document.createElement('p');
        newUserItemElmP.innerText = msg.name;
        const newUserItemElmI = document.createElement('i');
        newUserItemElmI.className = 'fas fa-user fa-2x';
        newUserItemElmI.id = `user-${msg.id}-reaction`;
        newUserItemElmDiv.appendChild(newUserItemElmP);
        newUserItemElmDiv.appendChild(newUserItemElmI);
        userList.appendChild(newUserItemElmDiv);

        const opt = document.createElement('option');
        opt.innerText = msg.name;
        opt.value = msg.id;
        usersSelect.appendChild(opt);
    });

    socket.on(REACTION_EVENT, msg => {
        console.log(msg);
        if (msg.reaction === 'raiseHand') {
            reactionsCount.innerText = `挙手の数: ${msg.reactionscount}`;
        }
        const elm = document.getElementById(`user-${msg.id}-reaction`);
        let reaction = 'fa-user';
        switch (msg.reaction) {
            case 'good': reaction = 'fa-thumbs-up'; break;
            case 'bad': reaction = 'fa-thumbs-down'; break;
            case 'hand': reaction = 'fa-hand-paper'; break;
            case 'raiseHand': reaction = 'fa-hand-paper'; break;
            case 'lowerHand': reaction = 'fa-user'; break;
        }
        elm.classList.remove('fa-user');
        elm.classList.add(reaction);
        elm.classList.add('update-reaction');
        if (msg.reaction === 'raiseHand') {
            return;
        } else if (msg.reaction === 'lowerHand') {
            const newReactionElm = document.createElement('i');
            newReactionElm.className = 'fas fa-user fa-2x';
            newReactionElm.id = `user-${msg.id}-reaction`;
            document.getElementById(`user-${msg.id}-reaction`).remove();
            document.getElementById(`user-${msg.id}-item`).appendChild(newReactionElm);
        } else {
            if (timerList[msg.name]) {
                clearTimeout(timerList[msg.name]);
            }
            timerList[msg.name] = setTimeout(() => {
                const newReactionElm = document.createElement('i');
                newReactionElm.className = 'fas fa-user fa-2x';
                newReactionElm.id = `user-${msg.id}-reaction`;
                document.getElementById(`user-${msg.id}-reaction`).remove();
                document.getElementById(`user-${msg.id}-item`).appendChild(newReactionElm);
            }, 5000);
        }
    });

    socket.on(CLEAR_COUNT_EVENT, () => {
        reactionsCount.innerText = `挙手の数: 0`;
    });
    socket.on(LEFT_EVENT, msg => {
        if (msg.id === socket.id) {
            console.log('left my self');
            localStorage.removeItem(`${roomNameText}-name`);
            location.reload();
        } else {
            participantsCount.innerText = `現在の参加者: ${msg.participantscount}人`;
            console.log(`left ${msg.name}`);
            if (timerList[msg.name]) {
                clearTimeout(timerList[msg.name]);
            }
            document.getElementById(`user-${msg.id}-item`).remove();
            const removeOptionIndex = Array.from(usersSelect.childNodes).findIndex(e => e.value === msg.id);
            usersSelect.remove(removeOptionIndex);
        }
    });
    socket.on('reconnect', () => {
        const elm = document.createElement('i');
        elm.className = 'fas fa-heartbeat fa-2x heartbeat-online';
        heartbeat.textContent = null;
        heartbeat.appendChild(elm);
    })
    socket.on('disconnect', reason => {
        console.warn(reason);
        postError({
            message: reason,
            id: socket.id
        });
        const elm = document.createElement('i');
        elm.className = 'fas fa-heartbeat fa-2x heartbeat-offline';
        heartbeat.textContent = null;
        heartbeat.appendChild(elm);
        Swal.fire('WebSocket接続が切断されました', reason, 'error').finally(() => {
            location.reload();
        });
    });
    socket.on(ERROR_EVENT, err => {
        Swal.fire('エラーが発生しました', err.toString(), 'error').finally(() => {
            location.reload();
        });
    });
    socket.on('error', err => {
        console.error(err);
        postError({
            message: err.toString(),
            id: socket.id
        });
        const elm = document.createElement('i');
        elm.className = 'fas fa-heartbeat fa-2x heartbeat-offline';
        heartbeat.textContent = null;
        heartbeat.appendChild(elm);
        Swal.fire('WebSocket接続でエラーが発生しました', err.toString(), 'error');
    });

    goodButton.addEventListener('click', () => {
        onClickReactionButton('good', userNameText);
    });
    badButton.addEventListener('click', () => {
        onClickReactionButton('bad', userNameText);
    });
    handButton.addEventListener('click', () => {
        onClickReactionButton('hand', userNameText);
    });
    handRaiseButton.addEventListener('click', () => {
        onClickReactionButton('raiseHand', userNameText);
        reactionsCount.innerText = `挙手の数: ${parseInt(reactionsCount.innerText.match(/[0-9]+/)[0], 10) + 1}`;
    });
    handLowerButton.addEventListener('click', () => {
        onClickReactionButton('lowerHand', userNameText);
    });
    clearCountButton.addEventListener('click', () => {
        socket.emit(CLEAR_COUNT_EVENT, {
            room: roomNameText
        });
        reactionsCount.innerText = `挙手の数: 0`;
    });
    userLeaveButton.addEventListener('click', () => {
        const leaveUserID = usersSelect.value;
        socket.emit(LEAVE_EVENT, {
            id: leaveUserID,
            room: roomNameText
        });
    });
})();