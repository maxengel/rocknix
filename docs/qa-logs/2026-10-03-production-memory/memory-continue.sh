#!/bin/bash
set -euo pipefail
R=/workspace/repos/rocknix.worktrees/conflict-resolution
O=/workspace/tmp/rasteratops-m7-production-memory-01
export VM_PAIR_DIR=$O/pair CLOUD_QA_STATE=$O/cloud CLOUD_QA_BACKEND=webdav
P=''; CLOUD_STARTED=0
stop_guest() {
  if [ -n "$P" ] && [ -r "/proc/$P/cmdline" ] && tr '\0' '\n' < "/proc/$P/cmdline" | grep -Fq "$O/guest-d.qcow2"; then
    kill "$P"
    for n in $(seq 1 60); do [ ! -e "/proc/$P" ] && break; sleep 0.25; done
    [ ! -e "/proc/$P" ] || { echo 'Owned QEMU did not exit'; return 1; }
  fi
  P=''
}
cleanup() { stop_guest; if [ "$CLOUD_STARTED" = 1 ]; then "$R/tools/cloud-test-backend" down; fi; }
trap cleanup EXIT
cd "$R"
sha256sum -c "$O/harness.sha256"
SSH=(ssh -n -i "$O/pair/qa-key" -p 10026 -o BatchMode=yes -o ConnectTimeout=8 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR root@127.0.0.1)
start_guest() {
  ./projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm run --headless --daemonize --gl "$1" --res 640x480 --monitor /tmp/rocknix-qemu-monitor-d.sock --serial /tmp/rocknix-qemu-serial-d.sock --pidfile /tmp/rocknix-qemu-d.pid --vnc 12 --ssh-port 10026 --mac 52:54:00:52:4E:5B "$O/guest-d.qcow2"
  P=$(cat /tmp/rocknix-qemu-d.pid)
  ./tools/vm-serial --socket /tmp/rocknix-qemu-serial-d.sock wait --up-to 300
}
measure() {
  local name=$1 count=$2; shift 2
  ./tools/es-launch-memory --port 10026 --identity "$O/pair/qa-key" --warmup 5 --cycles "$count" --max-vmsize-kib 1024 --max-rss-kib 2048 --output "$O/artifacts/$name" "$@"
}
./projects/ROCKNIX/devices/GENERIC_X64/vm/generic-x64-vm qemu-args --headless --gl none --res 640x480 --ssh-port 10026 --mac 52:54:00:52:4E:5B "$O/guest-d.qcow2" > "$O/artifacts/software-qemu-args.json"
start_guest none
measure software-10 10
./tools/cloud-test-backend up
CLOUD_STARTED=1
./tools/cloud-test-backend rclone-conf > "$O/qa-cloud.conf"
chmod 600 "$O/qa-cloud.conf"
scp -q -i "$O/pair/qa-key" -P 10026 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR "$O/qa-cloud.conf" root@127.0.0.1:/storage/.config/rclone/rclone.conf
"${SSH[@]}" 'systemctl stop essway; . /etc/profile >/dev/null 2>&1; set_setting cloudsaves.startup 0; set_setting cloudsaves.gameexit 1; cloud_setup --seed-folders; printf "M7 production memory QA save\n" > /storage/roms/gb/M7Memory.srm; systemctl start essway'
measure software-sync-50 50 --expect-exit-sync
./tools/signin-memory 10026 --key "$O/pair/qa-key" --seconds 30 --json > "$O/artifacts/signin-memory.json"
cat "$O/artifacts/signin-memory.json"
printf 'PASS production memory sequence and sign-in load\n'
