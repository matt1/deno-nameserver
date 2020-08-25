import { assertEquals, assert, _format} from "https://deno.land/std/testing/asserts.ts";
import { hex, ipv4ToNumber, normaliseIpv6, ipv6ToNumber, ipv6ToBytes } from "./utils.ts";

Deno.test('Utils converts IPv4 addresses from strings to ints', () => {
  assertEquals(ipv4ToNumber('127.0.0.1'), 2130706433);
  assertEquals(ipv4ToNumber('0.0.0.0'), 0);
  assertEquals(ipv4ToNumber('1.2.3.4'), 16909060);
});

Deno.test('Utils converts numbers to hex', () => {
  assertEquals(hex(0), '0x0');
  assertEquals(hex(100), '0x64');
});

Deno.test('Utils normalises IPv6', () => {
  assertEquals(normaliseIpv6('0:0:0:0:0:0:0:1'), '0:0:0:0:0:0:0:1');
  assertEquals(normaliseIpv6('::1'), '0:0:0:0:0:0:0:1');
  assertEquals(normaliseIpv6('1::'), '1:0:0:0:0:0:0:0');
  assertEquals(normaliseIpv6('2001:db8::2:1'), '2001:db8:0:0:0:0:2:1');
  assertEquals(normaliseIpv6('2001:db8:0:1:1:1:1:1'), '2001:db8:0:1:1:1:1:1');
});

Deno.test('Utils converts IPv6 address to number', () => {
  assertEquals(ipv6ToNumber('::1'), 1n);
  assertEquals(ipv6ToNumber('2001:db8:0:0:0:0:2:1'), 42540766411282592856903984951653957633n);
  assertEquals(ipv6ToNumber('2001:db8:0:1:1:1:1:1'), 42540766411282592875351010504635121665n);
});

Deno.test('Utils converts IPv6 address to byte array', () => {
  assertEquals(ipv6ToBytes('::1'), Uint16Array.from([0, 0, 0, 0, 0, 0, 0, 1]));
  assertEquals(ipv6ToBytes('8:7:6:5:4:3:2:1'), Uint16Array.from([8, 7, 6, 5, 4, 3, 2, 1]));
  assertEquals(ipv6ToBytes('8193:7:6:fff5:4:3:2:1'), Uint16Array.from([33171, 7, 6, 65525, 4, 3, 2, 1]));
});