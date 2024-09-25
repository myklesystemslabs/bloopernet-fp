// Implementing the Timesync protocol from timesync.js:
// https://www.npmjs.com/package/timesync

import type * as Party from "partykit/server";

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onMessage(message: string, sender: Party.Connection) {
    const data = JSON.parse(message);
    console.log('message', data);

    const response = {
      "jsonrpc": "2.0",
      id: data && 'id' in data ? data.id : null,
      result: Date.now()
    };
    
    sender.send(JSON.stringify(response));
    
    console.log('message sent:');
    console.log(response);
  }
}

Server satisfies Party.Worker;
