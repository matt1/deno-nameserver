# `deno-nameserver` is a DNS Server written using Deno

This is a very basic experiment at writing a simple DNS server using Deno, using
the currently-unstable UDP datagram support in Deno (i.e. you have to run with `--unstable`).

It is intended to act as a local server to respond to basic queries, and does
not offer recursive lookups.

Obviously this is **not stable and not for production use**! It seems like `dig`
et al though seem to be happy enough with the responses it sends.

## Usage

Update the content of `config.ts` as required (see below), then run it:

```bash
deno run --unstable --allow-net main.ts
```

### Configuring the server via `config.ts`

#### `IP` & `PORT`
Typically you'll want to leave these alone and keep them at their defaults of
`0.0.0.0` and `53` - this will make the server listen on all IPs at the usual
port for DNS servers.

#### `NAMES`
This is where you configure the names you want to respond to.

In this example there are two names that the server is configured to respond to.

```javascript
  public static readonly NAMES:DNSConfig = {
    'MyNas.whatever': {
      ttl: 3600,
      class: {
        'IN': {
          'A': '192.168.0.17',
        }
      }
    },
    'HomePrinter.something.cool': {
      ttl: 3600,
      class: {
        'IN': {
          'A': '192.168.0.123',
        }
      }
    },
  };
```

Add as many records as you need. Typically you'll want them all to be `IN` class
(i.e. internet) and `A` record types (i.e. IPv4 address). Note that your OS or
router's DHCP settings might automatically append a suffix to any name you try
to lookup - either disable that, or add an entry with the suffix if you want to
serve those names.

Since the config is actually included as a typesccript module, you can do
cunning stuff in the `config.ts` file if you really want to, such as dynamic
names or addresses. As far as I am aware (and I have done *zero* research here)
this is something fairly unique among DNS servers. The flip side is that it has
absolutely zero fault tolerance since it needs to be compiled as it is actually
typescript code.


# Why? Why don't you use `dnsmasq` or whatever?

This was just written for the fun of it. I needed a simple DNS server and I
thought it would be more fun to write my own than read the docs for dnsmasq.