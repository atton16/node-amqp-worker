const amqp = require('amqplib');

const config = {
  url: 'amqp://localhost',
  reconnectMs: 3000,
  queue: 'work'
};

let workFn = function(work, ack) {
  console.warn('Undefined work function!');
  ack();
}

function connect() {
  console.log('Connecting...');
  return amqp.connect(config.url)
    .then(onConnected)
    .catch(onError);
}

function reconnect() {
  console.log(`Reconnect in ${config.reconnectMs} ms...`);
  return setTimeout(connect, config.reconnectMs);
}

function onConnected(conn) {
  conn.on('close', onClosed);
  console.log('Connected to Queue Server.');
  process.once('SIGINT', conn.close);
  return conn.createChannel()
    .then(ch => onChannelCreated(conn, ch));
}

function onClosed() {
  console.log('Connection closed!');
  return reconnect();
}

function onError(err) {
  if (err.cause && err.cause.code === 'ECONNREFUSED') {
    console.log('Connection refused!');
    return reconnect();
  } else if (
    err.message.indexOf('NOT_FOUND') !== -1 &&
    err.message.indexOf('no queue') !== -1 &&
    err.ch &&
    err.conn
  ) {
    console.log('Queue not found error!');
    err.ch.close();
    err.conn.close();
    return;
  } else if (
    err.message.indexOf('BasicConsume') !== -1 &&
    err.message.indexOf('NOT_FOUND') !== -1 &&
    err.message.indexOf('no queue') !== -1
  ) {
    return;
  }
  console.warn(err);
}

function onChannelCreated(conn, ch) {
  ch.on('error', err => {
    err.conn = conn;
    err.ch = ch;
    return onError(err);
  });
  console.log('Task consumption channel created.');
  return ch.consume(
    config.queue,
    msg => doWork(ch, msg),
    {noAck: false}
  );
}

function doWork(ch, msg) {
  const work = parseWork(msg.content);
  if (!work) {
    console.log('Cannot parse message!');
    return;
  }

  workFn(work, function (replyStr){
    // RPC Work
    if (msg.properties.replyTo) {
      if (!replyStr) {
        replyStr = '';
      } else if (typeof replyStr !== 'string') {
        throw new Error('replyStr is not a string');
      }
      ch.sendToQueue(msg.properties.replyTo,
        Buffer.from(replyStr, 'utf8'),
        {correlationId: msg.properties.correlationId});
    }

    ch.ack(msg);
  });

}

function parseWork(content) {
  let work;
  try {
    work = JSON.parse(content.toString('utf8'));
    if (typeof work.name !== 'string') throw new Error();
    if (work.args && typeof work.args !== 'object') throw new Error();
  } catch (e) {}
  return work;
}

function init(userConfig, userWorkFn) {
  if (typeof userConfig === 'object') {
    config.url = userConfig.url || config.url;
    config.reconnectMs = userConfig.reconnectMs || config.reconnectMs;
    config.queue = userConfig.queue || config.queue;
  }

  if (typeof userWorkFn !== 'function') {
    throw new Error('Work function is not a function.');
  }

  workFn = userWorkFn;

  connect();
}

module.exports = init;