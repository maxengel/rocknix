"""Stop only the QEMU that has this exact owned disk argument, and await exit."""
from pathlib import Path
import os
import signal
import sys

pid = int(sys.argv[1])
disk = os.fsencode(sys.argv[2])
proc = Path('/proc') / str(pid)
try:
    args = (proc / 'cmdline').read_bytes().split(b'\0')
    if not args or not args[0]:
        raise SystemExit(0)
    assert Path(os.fsdecode(args[0])).name.startswith('qemu-system-'), args[0]
    drive = b'if=none,id=rocknix,format=qcow2,file=' + disk
    assert any(args[i] == b'-drive' and args[i + 1] == drive
               for i in range(len(args) - 1)), 'refusing to stop a process without the owned disk'
    # Hold a process handle so a reused numeric PID can never be signalled.
    handle = os.pidfd_open(pid)
    if (proc / 'cmdline').read_bytes().split(b'\0') != args:
        raise RuntimeError('process identity changed')
    signal.pidfd_send_signal(handle, signal.SIGTERM)
    import select
    poller = select.poll()
    poller.register(handle, select.POLLIN)
    if not poller.poll(20000):
        raise RuntimeError('owned QEMU did not exit within 20s')
    os.close(handle)
    print('PASS owned guest stopped', pid)
except (FileNotFoundError, ProcessLookupError):
    print('PASS owned guest already exited', pid)
