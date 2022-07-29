import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

class Chat {
  constructor() {
    this.yDoc = null;
    this.yArr = null;
    this.provider = null;
    this.user = null;
    this.roomName = null;
    this.password = null;

    this.messages = [];

    let outer = document.createElement('div');
    $(outer).addClass('chat');
    this.outer = outer;

    let head = document.createElement('div');
    $(head).addClass('chatHead');
    this.head = head;

    let body = document.createElement('div');
    $(body).addClass('chatBody');
    this.body = body;

    let foot = document.createElement('div');
    $(foot).addClass('chatFoot');
    this.foot = foot;

    let form = document.createElement('form');

    let input = document.createElement('input');
    $(input).addClass('chatInput form-control');
    $(input).attr({
      'type': 'text',
      'placeholder': 'Connect to a room first!',
    });
    $(input).prop('disabled', true);

    this.form = form;
    this.input = input;
    $(form).append(input);
    $(foot).append(form);

    $(outer).append(head, body, foot);

    this.connected = false;
  }

  /**
   * 
   * @param {JQuery<HTMLElement>} parent 
   */
  mount(parent) {
    $(parent).append(this.outer);
  }

  /**
   * 
   * @param {string} user The username for the client entering the room.
   * @param {string} roomName The name of the room to join.
   * @param {string} password An optional password for the room.
   */
  connect(user, roomName, password = '') {
    if (this.connected) {
      throw new Error('Tried to connect a chat component that was already connected!');
    }

    $(this.messages).remove();
    this.messages = [];

    this.head.innerHTML = 'Connecting...';

    this.user = user;
    this.roomName = roomName;
    this.password = password;

    this._setupYjs();

    setTimeout(() => {
      this.yArr.push([{
        'type': 'join',
        'user': this.user,
      }]);
    this.head.innerHTML = `Hello, <b>${this.user}</b>! You are in room <code>${this.roomName}</code>.`;
    }, 1000);

    this._enableInput();

    this.connected = true;
  }

  disconnect() {
    if (!this.connected) {
      throw new Error('Tried to disconnect a chat component that wasn\'t connected!');
    }

    this._teardownYjs();
    this._disableInput();

    this.head.innerHTML = '';

    this.user = this.roomName = this.password = null;
    this.connected = false;
  }

  getState() {
    if (this.yArr) {
      // return JSON.stringify(this.yArr);
      return this.messages;
    }
  }

  /**
   * 
   * @param {{type: string; user: string; content: string | undefined;}} msgObj 
   * @private
   */
  _genMsgDiv(msgObj) {
    let msgDiv = document.createElement('div');
    $(msgDiv).addClass('chatMessage');
    switch (msgObj.type) {
      case 'join':
        msgDiv.innerHTML = `Welcome! <b>${msgObj.user}</b> has joined the room.`;
        break;
      case 'leave':
        msgDiv.innerHTML = `Bye bye! <b>${msgObj.user}</b> has left the room.`;
        break;
      case 'message':
        if (msgObj.user === this.user) {
          const mouseIn = event => {
            $(msgDiv).css({
              'background-color': 'whitesmoke',
            });
            $(msgDiv).on('dblclick', event => {
              console.log('deleted own message');
              for (let i = 0; i < this.messages.length; ++i) {
                if (this.messages[i] === msgDiv) {
                  this.yArr.delete(i);
                  break;
                }
              }
            });
          };

          const mouseOut = event => {
            $(msgDiv).css({
              'background-color': '',
            });
            $(msgDiv).off('dblclick');
          }
          $(msgDiv).on('mouseenter', mouseIn).on('mouseleave', mouseOut);
        }
        msgDiv.innerHTML = `<b>${msgObj.user}: </b>${msgObj.content}`;
        break;
      default:
        throw new Error(`msgObj did not have a valid type attribute.`);
    }

    return msgDiv;
  }

  /**
   * 
   * @param {Array<{type: string; user: string; content: string | undefined;}} messages 
   * @private
   */
  _msgPush(messages) {
    let toInsert = messages.map(msgObj => this._genMsgDiv(msgObj));
    this.body.append(...toInsert);
    this.messages.push(...toInsert);
  }

  /**
   * 
   * @param {number} idx 
   * @param {Array<{type: string; user: string; content: string | undefined;}} messages 
   * @private
   */
  _msgSplice(idx, messages) {
    let toInsert = messages.map(msgObj => this._genMsgDiv(msgObj));
    this.messages[idx].before(...toInsert)
    this.messages.splice(idx, 0, ...toInsert);
  }

  /**
   * 
   * @param {number} idx 
   * @param {number} count
   * @private
   */
  _msgDelete(idx, count) {
    let toRemove = this.messages.splice(idx, count);
    $(toRemove).remove();
  }

  /**
   * 
   * @param {Array<{insert?: string | any[] | undefined; delete?: number | undefined; retain?: number | undefined;}>} delta The changes to the y-array in delta form
   * @private
   */
  _applyChanges(delta) {
    let curr = 0;
    delta.forEach(x => {
      if ('retain' in x) {
        curr += x['retain'];
      } else if ('insert' in x) {
        if (curr === this.messages.length) {
          this._msgPush(x['insert']);
        } else {
          this._msgSplice(curr, x['insert']);
        }
        curr += x['insert'].length;
      } else if ('delete' in x) {
        this._msgDelete(curr, x['delete']);
      } else {
        throw new Error('an invalid delta element was found');
      }
    })
  }

  /**
   * @private
   */
  _setupYjs() {
    /** @type {Y.Doc} */ this.yDoc = new Y.Doc();
    /** @type {Y.Array} */ this.yArr = this.yDoc.getArray('chat');
    this.provider = new WebrtcProvider(this.roomName, this.yDoc, { password: this.password } );

    this.yArr.observe(event => {
      this._applyChanges(event.changes.delta);
    });
  }

  /**
   * @private
   */
  _enableInput() {
    $(this.input).attr({
      'placeholder': 'Send a message...',
    });

    $(this.input).prop('disabled', false);

    $(this.form).on('submit', e => {
      if (this.input.value === '') {
        return false;
      }

      this.yArr.push([{
        'type': 'message',
        'user': this.user,
        'content': this.input.value,
      }]);

      this.input.value = '';

      return false;
    });
  }

  /**
   * @private
   */
  _teardownYjs() {
    this.yArr.push([
      {
        'type': 'leave',
        'user': this.user
      }
    ]);

    this.yDoc.destroy();
    this.yDoc = this.yArr = this.provider = null;
  }

  /**
   * @private
   */
  _disableInput() {
    $(this.input).attr({
      'placeholder': 'Connect to a room first!',
    });

    $(this.input).prop('disabled', true);
    $(this.form).off('submit');
  }
}

export default Chat;