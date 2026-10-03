#!/bin/bash
set -euo pipefail
cd /workspace/tmp/rasteratops-m7-production-memory-01
printf 'Decompressing retained candidate for independent guest d\n'
gunzip -c /workspace/artifacts/rasteratops-candidates/sha256/83751e812351c72fc80a6a3cf418929769158684345cf6dd5f9e0fbcd9877d21/RASTERATOPS-GENERIC_X64.x86_64-0.0.1-from-ROCKNIX.img.gz > image.img
printf 'Converting and sizing guest disk\n'
qemu-img convert -f raw -O qcow2 image.img guest-d.qcow2
qemu-img resize guest-d.qcow2 16G
qemu-img check guest-d.qcow2
qemu-img info --output=json guest-d.qcow2 > artifacts/disk-initial.json
rm image.img
ssh-keygen -q -t ed25519 -N '' -f pair/qa-key -C m7-guest-d
printf 'PASS independent guest disk and QA identity prepared; guest not started\n'
