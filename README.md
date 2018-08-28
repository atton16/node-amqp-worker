# node-amqp-worker

Node.JS AMQP Worker Engine

Consume work from specified work queue and notify MQ Broker once the work is complete.

### Usage Example

```javascript
const worker = require('amqp-worker-engine');

const config = {
  url: 'amqp://localhost',
  queue: 'my-works'
};

const workFn = function(work, ack) {
  switch(work.name) {
  case 'greet':
    console.log('Hello');
    break;
    
  case 'greet-person':
    console.log(`Hello ${work.args.person}`);
    break;
    
  default:
  	break;
  }
  ack();
};

worker(config, workFn);

```

### Configuration

```javascript
{
  url: 'amqp://localhost',   // MQ Broker host url
  reconnectMs: 3000,         // Auto-reconnect interval
  queue: 'work'              // Work queue name
}
```


### Work Message Format

Work message is parsed as an object to the `Work Function`.

The message published to work queue MUST BE conform to the following format.

```javascript
{
	name: string,
    args: object  // Optional
}
```

### Work Function

Work Function takes two arguments

1. Work Object

   which is the work to be done classified by its `name`.
   
   Any additional inputs is given to work function in `args`.
   
   `args` can either be `object` or `array`
   
2. Ack Callback

   the callback function, MUST BE called right after the work is done to notify MQ Broker that we have completed the given work.


### License

MIT License

Copyright (c) 2018 Attawit Kittikrairit

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
