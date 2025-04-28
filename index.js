const dgram = require("node:dgram");
const dnsPacket = require("dns-packet");
const server = dgram.createSocket("udp4");
require("dotenv").config();

const db = {
  "example.com": {
    type: "A",
    data: "1.2.3.4",
  },
  "server.example.com": {
    type: "CNAME",
    data: "example.com",
  },
};

server.on("message", (msg, rinfo) => {
  const incomingReq = dnsPacket.decode(msg);
  const ipFromDb = db[incomingReq.questions[0].name];

  // If we have this domain in our database
  if (ipFromDb) {
    const ans = dnsPacket.encode({
      type: "response",
      id: incomingReq.id,
      flags: dnsPacket.AUTHORITATIVE_ANSWER,
      questions: incomingReq.questions,
      answers: [
        {
          type: ipFromDb.type,
          class: "IN",
          name: incomingReq.questions[0].name,
          data: ipFromDb.data,
        },
      ],
    });
    server.send(ans, rinfo.port, rinfo.address);
  } else {
    // If domain not in our database, forward the request to third party dna
    const forwardClient = dgram.createSocket("udp4");

    forwardClient.on("message", (response) => {
      // Forward the response back to the original client
      server.send(response, rinfo.port, rinfo.address);
      forwardClient.close();
    });

    forwardClient.on("error", (err) => {
      console.error("DNS forwarding error:", err);
      forwardClient.close();
    });

    // Send the original request to External DNS
    forwardClient.send(msg, 53, "9.9.9.9");
  }
});

server.on("error", (err) => {
  console.error(`DNS Server error:\n${err.stack}`);
  server.close();
});

server.on("close", () => {
  console.log("DNS Server closed");
});

server.on("listening", () => {
  const address = server.address();
  console.log(`DNS Server listening on ${address.address}:${address.port}`);
});

const PORT = parseInt(process.env.DNS_PORT, 10);

server.bind(PORT);

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});
