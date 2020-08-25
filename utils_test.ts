import { assertEquals, assert} from "https://deno.land/std/testing/asserts.ts";
import { hex, numberToIpv4, normaliseIpv6 } from "./utils.ts";

Deno.test('Utils converts IPv4 addresses from strings to ints', () => {
  assertEquals(numberToIpv4('127.0.0.1'), 2130706433);
  assertEquals(numberToIpv4('0.0.0.0'), 0);
  assertEquals(numberToIpv4('1.2.3.4'), 16909060);
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