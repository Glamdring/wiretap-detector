// sloppy traceroute clone
// inpired by https://blogs.oracle.com/ksplice/entry/learning_by_doing_writing_your
// and made possible by https://www.npmjs.org/package/raw-socket

var raw = require('raw-socket');
var dns = require('dns');

var target = '1.1.1.1';
var MAX_HOPS = 16;
var TIME_LIMIT = 5000;

function resolveFirst(dest, cb) {
  dns.resolve(dest, function (err, addresses) {
    if (err) throw err;
    dns.reverse(addresses[0], function(err, domains) {
      if (err) {
        cb(addresses[0], '');
      } else {
        cb(addresses[0], domains);
      }
    });
  });
}

function ping(dest, ttl, cb) {
  var sentTime;
  var buffer = new Buffer ([
          0x08, 0x00, 0x43, 0x52, 0x00, 0x01, 0x0a, 0x09,
          0x61, 0x62, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68,
          0x69, 0x6a, 0x6b, 0x6c, 0x6d, 0x6e, 0x6f, 0x70,
          0x71, 0x72, 0x73, 0x74, 0x75, 0x76, 0x77, 0x61,
          0x62, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69]);

  var socketLevel = raw.SocketLevel.IPPROTO_IP
  var socketOption = raw.SocketOption.IP_TTL;

  var socket = raw.createSocket();
  socket.setOption(socketLevel, socketOption, ttl);
  socket.send(buffer, 0, buffer.length, dest, function(err, bytes) {
    if (err) throw err;
    sentTime = new Date().getTime();
  });

  var timeout = true;

  socket.on("message", function (buffer, source) {
    socket.close();
    timeout = false;
    cb(buffer, source, (new Date().getTime() - sentTime));
  });

  setTimeout(function() {
    if (timeout) cb(null, '???', TIME_LIMIT);
  }, TIME_LIMIT);
}

export const trace = async (dest: string, ttl: number, callback) => {
  ping(dest, ttl, function(buffer, source, time) {
    if (time <= TIME_LIMIT && source) {
      resolveFirst(source, function(address, domains) {
        callback(ttl + '\t' + address + '\t' + domains + '\t' + time + 'ms');
        if (source == dest || ttl == MAX_HOPS) process.exit(0);
        trace(dest, ttl + 1);
      });
    } else {
      callback(ttl + '\t' + source);
      if (source == dest || ttl == MAX_HOPS) process.exit(0);
      trace(dest, ttl + 1);
    }
  });
}

resolveFirst(target, function(address, domains) {
  console.log('Traceroute to', address, domains);
  trace(address, 1);
});