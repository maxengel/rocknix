#!/usr/bin/env python3
"""Frames from QEMU's VNC server on a cadence, each a PNG, with a per-frame signature so a card at the top or a
dialog in the middle can be found without opening every file (fork #292 proof). RFB 3.8, raw, stdlib only.
    vnc-grab.py HOST:PORT OUTDIR PREFIX STOPFILE [cadence_s]
Writes OUTDIR/PREFIX-NNNN.png and appends to OUTDIR/PREFIX.csv: n, epoch, top, mid -- the mean absolute
difference (0..255) of the top band (rows 8..100) and the middle band (rows 170..320) against the FIRST frame."""
import socket, struct, sys, zlib, time, os

def read(s, n):
    b = b""
    while len(b) < n:
        c = s.recv(n - len(b))
        if not c: raise IOError("vnc closed")
        b += c
    return b

def grab(host, port, timeout=2.0):
    s = socket.create_connection((host, port), timeout=timeout)
    read(s, 12); s.sendall(b"RFB 003.008\n")
    n = read(s, 1)[0]
    if n == 0:
        rl = struct.unpack(">I", read(s, 4))[0]; raise IOError("vnc refused: " + read(s, rl).decode(errors="replace"))
    types = read(s, n)
    if 1 not in types: raise IOError("vnc wants security %r" % (types,))
    s.sendall(b"\x01")
    if struct.unpack(">I", read(s, 4))[0] != 0: raise IOError("vnc security failed")
    s.sendall(b"\x01")
    w, h = struct.unpack(">HH", read(s, 4))
    read(s, 16); nl = struct.unpack(">I", read(s, 4))[0]; read(s, nl)
    s.sendall(b"\x00\x00\x00\x00" + struct.pack(">BBBBHHHBBB", 32, 24, 0, 1, 255, 255, 255, 16, 8, 0) + b"\x00\x00\x00")
    s.sendall(b"\x02\x00" + struct.pack(">H", 1) + struct.pack(">i", 0))
    s.sendall(b"\x03\x00" + struct.pack(">HHHH", 0, 0, w, h))
    fb = bytearray(w * h * 4); deadline = time.time() + timeout; covered = 0
    while covered < w * h and time.time() < deadline:
        mt = read(s, 1)[0]
        if mt != 0:
            if mt == 2: continue
            if mt == 3: read(s, 3); l = struct.unpack(">I", read(s, 4))[0]; read(s, l); continue
            raise IOError("vnc message %d" % mt)
        read(s, 1); nrect = struct.unpack(">H", read(s, 2))[0]
        for _ in range(nrect):
            x, y, rw, rh, enc = struct.unpack(">HHHHi", read(s, 12))
            if enc != 0: raise IOError("vnc encoding %d" % enc)
            data = read(s, rw * rh * 4)
            for row in range(rh):
                o = ((y + row) * w + x) * 4
                fb[o:o + rw * 4] = data[row * rw * 4:(row + 1) * rw * 4]
            covered += rw * rh
    s.close()
    return w, h, fb

def png(path, w, h, fb):
    raw = b"".join(b"\x00" + bytes(v for px in range(w) for v in (fb[(r * w + px) * 4 + 2], fb[(r * w + px) * 4 + 1], fb[(r * w + px) * 4])) for r in range(h))
    def chunk(t, d): return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    open(path, "wb").write(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw, 6)) + chunk(b"IEND", b""))

def band(fb, w, r0, r1):
    # every 4th pixel of every 2nd row, the green byte only: enough to see a card or a dialog
    return bytes(fb[(r * w + px) * 4 + 1] for r in range(r0, r1, 2) for px in range(0, w, 4))

def diff(a, b):
    return sum(abs(x - y) for x, y in zip(a, b)) / max(1, len(a))

if __name__ == "__main__":
    host, port = sys.argv[1].rsplit(":", 1); out = sys.argv[2]; prefix = sys.argv[3]; stop = sys.argv[4]
    cadence = float(sys.argv[5]) if len(sys.argv) > 5 else 0.5
    os.makedirs(out, exist_ok=True)
    csv = open(os.path.join(out, prefix + ".csv"), "a")
    first = None; n = 0
    while not os.path.exists(stop):
        t = time.time()
        try:
            w, h, fb = grab(host, int(port))
        except Exception as e:
            csv.write("%d,%.2f,err,%s\n" % (n, t, str(e).replace(",", ";"))); csv.flush(); time.sleep(cadence); continue
        top = band(fb, w, 8, min(100, h)); mid = band(fb, w, 170, min(320, h))
        if first is None: first = (top, mid)
        png(os.path.join(out, "%s-%04d.png" % (prefix, n)), w, h, fb)
        csv.write("%d,%.2f,%.1f,%.1f\n" % (n, t, diff(top, first[0]), diff(mid, first[1]))); csv.flush()
        n += 1
        rest = cadence - (time.time() - t)
        if rest > 0: time.sleep(rest)
    csv.close()
