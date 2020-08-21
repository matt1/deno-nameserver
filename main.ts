import { DNSServer } from "./dns_server.ts";
import { Config } from "./config.ts";

const dnsServer = new DNSServer(Config.NAMES);
const listener = Deno.listenDatagram({
  port: Config.PORT,
  hostname: Config.IP,
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
