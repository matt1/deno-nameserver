import { assertEquals} from "https://deno.land/std/testing/asserts.ts";
import { DNSServer } from "./dns_server.ts";
import { DNSConfig } from "./dns_server_config.ts";

Deno.test('DNSServer correctly answers basic A record request', () => {
  // Direct from a wireshark DNS capture made by Win10 `nslookup`.
  const data =  Uint8Array.from([
      0x00, 0x04, 0x01, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x07, 0x65, 0x78, 0x61,
      0x6d, 0x70, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00, 0x00, 0x01, 0x00, 0x01,
  ]);

  // Based on a wireshark DNS capture - TTL, IP and response code changed.
  const expectedResponse = Uint8Array.from([
      0x00, 0x04, 0x80, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x07, 0x65, 0x78, 0x61,
      0x6d, 0x70, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00, 0x00, 0x01, 0x00, 0x01, 0x07, 0x65, 0x78,
      0x61, 0x6d, 0x70, 0x6c, 0x65, 0x03, 0x63, 0x6f, 0x6d, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
      0x00, 0x64, 0x00, 0x04, 0x7f, 0x00, 0x00, 0x01
  ]);

  const config:DNSConfig = {
    'example.com': {
      ttl: 100,
      class: {
        'IN': {
          'A': '127.0.0.1',
        }
      }
    }
  };

  const server = new DNSServer(config);
  const response = server.HandleRequest(data);
  assertEquals(response, expectedResponse);
});