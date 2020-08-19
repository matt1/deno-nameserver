/** DNS Record Types. */
export enum DNSRecordType {
  UNKNOWN = 0,
  A = 1,          // IPv4 address record
  AAAA = 28,      // IPv6 address record
  CNAME = 5,      // Canonical name record
  PTR = 12,       // Pointer to a canonical name
}
