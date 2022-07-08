import './style.css'
import Chat from './src/Chat'

const user = 'Ben';
// const roomName = prompt("Room Name?");
const roomName = 'hello-there', password = 'ZrwUN^s#cFK2!Ei!';

let chat = new Chat;

let b1 = document.createElement('button');
$(b1).text('Connect');
$(b1).addClass('btn btn-primary');
$(b1).on('click', e => {
  chat.connect(user, roomName, password);
  $(b1).prop('disabled', true);
  $(b2).prop('disabled', false);
  
  return false;
})

let b2 = document.createElement('button');
$(b2).text('Disconnect');
$(b2).addClass('btn btn-danger');
$(b2).on('click', e => {
  chat.disconnect();
  $(b2).prop('disabled', true);
  $(b1).prop('disabled', false);
  
  return false;
});
$(b2).prop('disabled', true);

let b3 = document.createElement('button');
$(b3).text('Debug');
$(b3).addClass('btn btn-warning');
$(b3).on('click', () => {
  let state = chat.getState();
  console.log(state);

  return false;
})

let ctrl = document.createElement('div');
$(ctrl).addClass('ctrlDiv');

$(ctrl).append(b1, b2, b3);
$('#app').append(ctrl);

chat.mount($('#app'));