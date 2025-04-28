# DNS Server

A simple Node.js DNS server implementation that can resolve domains from a local database and forward unresolved queries to external DNS servers.

## Features

- Local DNS resolution for configured domains
- DNS forwarding for domains not in local database
- Support for A and CNAME record types
- Environment-based configuration

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/arpankumarde/dns
   cd dns
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```
DNS_PORT=5354
```

> **Note:** Using port 53 (standard DNS port) requires running the application with administrator/root privileges.

### Domain Database

The DNS server comes with a simple in-memory database. Domains are configured in the `db` object in `index.js`:

```javascript
const db = {
  "example.com": {
    type: "A",
    data: "1.2.3.4",
  },
  "server.example.com": {
    type: "CNAME",
    data: "example.com",
  },
};
```

To add more domains, simply extend this object with your own domain entries.

## Usage

Start the server:

```
npm start
```

### Testing with dig

You can test the DNS server using the `dig` command:

```
dig @localhost -p 5354 example.com
```

This should return the IP address defined in the domain database.

For domains not in the database, the query will be forwarded to the external DNS server (9.9.9.9):

```
dig @localhost -p 5354 google.com
```

## Architecture

The application consists of a UDP server that:

1. Listens for DNS requests
2. Decodes incoming requests using dns-packet
3. Checks if the requested domain exists in the local database
4. Either responds with the local record or forwards the request to an external DNS (9.9.9.9)

## Error Handling

The server includes error handling for:

- Server errors
- DNS forwarding errors
- Process uncaught exceptions
- Invalid port configurations
