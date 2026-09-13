#!/usr/bin/env python3
import select
import socket
import sys
import threading

listen = ('127.0.0.1', int(sys.argv[1]))
log_path = sys.argv[2]

def relay(client, upstream):
    try:
        while True:
            readable, _, _ = select.select((client, upstream), (), (), 60)
            if not readable:
                return
            for source in readable:
                data = source.recv(65536)
                if not data:
                    return
                (upstream if source is client else client).sendall(data)
    finally:
        for sock in (client, upstream):
            try:
                sock.shutdown(socket.SHUT_RDWR)
            except OSError:
                pass
            sock.close()

def handle(client):
    try:
        request = b''
        while b'\r\n\r\n' not in request:
            chunk = client.recv(4096)
            if not chunk:
                return
            request += chunk
        method, target, _ = request.split(b'\r\n', 1)[0].decode().split()
        if method != 'CONNECT':
            return
        host, port = target.rsplit(':', 1)
        with open(log_path, 'a', encoding='utf-8') as log:
            log.write(f'CONNECT {host}:{port}\n')
        upstream = socket.create_connection((host, int(port)), 30)
        client.sendall(b'HTTP/1.1 200 Connection Established\r\n\r\n')
        relay(client, upstream)
    except Exception:
        client.close()

with socket.socket() as server:
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(listen)
    server.listen()
    while True:
        client, _ = server.accept()
        threading.Thread(target=handle, args=(client,), daemon=True).start()
