# `deno-nameserver` is a DNS Server written using Deno

This very basic experiment at writing a simple DNS server using Deno, using the
currently-unstable UDP datagram support in Deno (i.e. you have to run with `--unstable`).

It is intended to act as a local server to respond to basic queries, and does
not offer recursive lookups.

Obviously this is **not stable and not for production use**!

## Why? Why don't you use `dnsmasq` or whatever?

This was just written for the fun of it. I needed a simple DNS server and I
thought it would be more fun to write my own than read the docs for dnsmasq.