import { DNSServer } from "./dns_server.ts";

const dnsServer = new DNSServer();
const listener = Deno.listenDatagram({
  port: 53,
  hostname: '192.168.1.43',
  transport: 'udp',
});

while (true) {
  const [data, remoteAddr] = await listener.receive();  
  const response = dnsServer.HandleRequest(data);
  await listener.send(response, remoteAddr);
}
