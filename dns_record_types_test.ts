import { assertEquals, _format} from "https://deno.land/std/testing/asserts.ts";
import { CNameResourceRecord, TxtResourceRecord } from "./dns_record_type.ts";

Deno.test('CName correctly returns payload bytes', () => {
  const cname = new CNameResourceRecord();
  cname.CName = 'testing';
  
  const expected = Uint8Array.from([7, 116, 101, 115, 116, 105, 110, 103]);

  assertEquals(cname.Payload, expected);
});

Deno.test('Txt correctly returns payload bytes', () => {
  const txt = new TxtResourceRecord();
  txt.Txt = 'testing';
  
  const expected = Uint8Array.from([116, 101, 115, 116, 105, 110, 103]);

  assertEquals(txt.Payload, expected);
});
