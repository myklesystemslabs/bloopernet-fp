// Implementing the Timesync protocol from timesync.js:
// https://www.npmjs.com/package/timesync

import type * as Party from "partykit/server";

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT,  DELETE',
  'Access-Control-Allow-Headers': 'Content-Type'
}
export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  reply(message: string) {
    const data = JSON.parse(message);

    const response = {
      "jsonrpc": "2.0",
      id: data && 'id' in data ? data.id : null,
      result: Date.now()
    };
    
    return JSON.stringify(response);
  }

  async onRequest(request: Party.Request) {
    // Check if it's a preflight request (OPTIONS) and handle it
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: CORS })
    }

    if (request.method === 'POST') {
      const bodystr = await request.text();
      console.log('message:')
      console.log(bodystr);
      const response = this.reply(bodystr);
      console.log('sending reply:');
      console.log(response);
      return new Response(response, { status: 200, headers: CORS })
    }
  }

  onMessage(message: string, sender: Party.Connection) {
    console.log('message', message);

    const response = this.reply(message);
    sender.send(response)
    
    console.log('message sent:');
    console.log(response);
  }
}

Server satisfies Party.Worker;
