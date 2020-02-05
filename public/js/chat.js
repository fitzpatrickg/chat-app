const socket = io();

//Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormButton = document.querySelector('#message-send');
const $messageFormInput = document.querySelector('#message-input');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    //new message element
    const $newMessage = $messages.lastElementChild;

    //height of new message
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    //visible height
    const visibleHeight = $messages.offsetHeight;

    //height of messages container
    const containerHeight = $messages.scrollHeight;

    //how far have i scrolled?
    const scrollOffset = $messages.scrollTop; + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
}

//user sidebar
socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });

    document.querySelector('#sidebar').innerHTML = html;
});


//messaging on/emit
socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mma')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    $messageFormButton.setAttribute('disabled', 'disabled');
    //This is an alternative way to grab the message, since it is inside the form, we have access to form elements.
    const message = e.target.elements.message.value;

    //Here we have a callback as a third arg. This is used for acknoledgement. On the server we are invoking this callback.
    //It will invoke on the senders computer, not on all connected sockets (like the message)
    socket.emit('sendMessage', message, (error) => {
       
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value =  '';
        
        $messageFormInput.focus();
        if (error) {
            return console.log(error);
        }

        console.log('message was delivered!');
    });
});


//sendLocation on/emit
socket.on('locationMessage', (locationMessage) => {
    console.log(locationMessage);
    const html = Mustache.render(locationTemplate, {
        username: locationMessage.username,
        url: locationMessage.text,
        createdAt: moment(locationMessage.createdAt).format('h:mma')
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

$sendLocationButton.addEventListener('click', () => {
    
    $sendLocationButton.setAttribute('disabled', 'disabled');

    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser');
    }

    navigator.geolocation.getCurrentPosition((position) => {
        
        socket.emit('sendLocation', { 
                latitude: position.coords.latitude, 
                longitude: position.coords.longitude 
            }, () => {
                $sendLocationButton.removeAttribute('disabled');
                console.log('location shared!');
        });
    });
});

socket.emit('join', { username, room }, (error) => {
    if(error) {
        alert(error);
        location.href = '/';
    }
});
