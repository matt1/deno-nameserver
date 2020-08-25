/** Print a number as a hex fomatted number. */
export function hex(num:number): string {
  return `0x${num.toString(16)}`;
}

/** Convert a IPv4 address like 1.2.3.4 to a number. */
export function ipv4ToNumber(ipv4:string):number {
  const bytes = ipv4.split('.');
  let result = 0;
  result += Number(bytes[0]) << 24;
  result += Number(bytes[1]) << 16;
  result += Number(bytes[2]) << 8;
  result += Number(bytes[3]);
  return result;
}

/** Convert a IPv6 address like 2001:db8::2:1 to a BigInt. */
export function ipv6ToNumber(ipv6:string):BigInt {
  const normalised = normaliseIpv6(ipv6);
  const groups = normalised.split(':');
  let result = 0n;
  result += BigInt(`0x${groups[0]}`) << 112n;
  result += BigInt(`0x${groups[1]}`) << 96n;
  result += BigInt(`0x${groups[2]}`) << 80n;
  result += BigInt(`0x${groups[3]}`) << 64n;
  result += BigInt(`0x${groups[4]}`) << 48n;
  result += BigInt(`0x${groups[5]}`) << 32n;
  result += BigInt(`0x${groups[6]}`) << 16n;
  result += BigInt(`0x${groups[7]}`);
  return result;
}

/** Convert a IPv6 address like 2001:db8::2:1 to a Uint16Array. */
export function ipv6ToBytes(ipv6:string):Uint16Array {
  const normalised = normaliseIpv6(ipv6);
  const groups = normalised.split(':');
  const result = new Uint16Array(8);
  const view = new DataView(result.buffer);

  let i = 0;
  for (const group of groups) {
    const num = parseInt(group, 16);
    view.setUint16(i, num, true);
    i += 2;
  }

  return result;
}

/** 
 * Normalise a IPv6 address so that `::` are replaced with zeros.
 */
export function normaliseIpv6(ipv6:string):string {
  if (ipv6.indexOf('::') < 0) return ipv6;

  // Use :: as the pivot and split into left and right.
  const parts = ipv6.split('::');
  const leftParts = parts[0].length === 0 ? [] : parts[0].split(':');
  const rightParts = parts[1].length === 0 ? [] : parts[1].split(':');

  // Work out how many zero-groups were collapsed in :: by counting length of
  // the left and right parts, then create the missing groups.
  const missingZeros = 8 - (leftParts.length + rightParts.length);
  const newZeros = [];
  for (let i = 0; i < missingZeros; i++) {
    newZeros.push('0');
  }
  return [...leftParts, ...newZeros, ...rightParts].join(':');
}