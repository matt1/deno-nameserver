import { DNSServer } from "./dns_server.ts";
import { ServerConfig } from "./config.ts";

const dnsServer = new DNSServer(ServerConfig.RECORDS);
const listener = Deno.listenDatagram({
  port: ServerConfig.PORT,
  hostname: ServerConfig.IP,
  transport: 'udp',
});

while (true) {
  try {
    const [data, remoteAddr] = await listener.receive();  
    const response = dnsServer.HandleRequest(data);
    await listener.send(response, remoteAddr);
  } catch (error) {
    console.error(error);
  }
}
