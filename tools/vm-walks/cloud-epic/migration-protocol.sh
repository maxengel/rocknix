# Sourced only by rasteratops-vm-cloud-epic after its isolated guest/backend checks.
# Runs the image's scripts and rclone; only the chosen provider operation is faulted.
# No image binary is replaced. All cases reset their cloud, pointers and local record.
PROTOCOL_ARMED=0
protocol_cleanup() {
 [ "$PROTOCOL_ARMED" = 0 ] || G_ 'if [ -f /tmp/cloud-epic-protocol/remote.saved ]; then mv /tmp/cloud-epic-protocol/remote.saved /storage/.config/rclone/rclone.conf; fi; rm -f /storage/.config/profile.d/999-cloud-epic-qa.sh /storage/roms/gb/QAUnlinkedLocal.srm /storage/roms/gb/QAUnlinkedRemote.srm; rm -rf /tmp/cloud-epic-protocol /storage/qa-not-a-cloud' >/dev/null 2>&1
}
protocol_init() {
 G_ 'test ! -e /storage/.config/profile.d/999-cloud-epic-qa.sh && test ! -e /tmp/cloud-epic-protocol' || return 1
 G_ 'mkdir -p /tmp/cloud-epic-protocol /storage/.config/profile.d' || return 1
 PROTOCOL_ARMED=1
 local script="$P/protocol-rclone"
 cat > "$script" <<'SH'
#!/bin/sh
if [ -f /tmp/cloud-epic-protocol/fault ] &&
   [ "$1 $2" = "$(cat /tmp/cloud-epic-protocol/fault)" ]; then
 printf '%s\n' "$1 $2" >> /tmp/cloud-epic-protocol/fired
 echo 'injected QA provider failure' >&2
 exit 5
fi
exec /usr/bin/rclone "$@"
SH
 scp -q -i "$KEY" -P "$PORT" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o LogLevel=ERROR \
  "$script" root@127.0.0.1:/tmp/cloud-epic-protocol/rclone || return 1
 G_ 'chmod 755 /tmp/cloud-epic-protocol/rclone; printf "export PATH=/tmp/cloud-epic-protocol:\$PATH\n" > /storage/.config/profile.d/999-cloud-epic-qa.sh' || return 1
 # Verify the production profile actually selects the shim; a fault not armed
 # at the image's call boundary cannot count as a successful negative control.
 G_ '. /etc/profile >/dev/null 2>&1; test "$(command -v rclone)" = /tmp/cloud-epic-protocol/rclone'
}
protocol_reset() {
 G_ 'systemctl stop essway; rm -f /tmp/cloud-epic-protocol/fault /tmp/cloud-epic-protocol/fired /storage/.config/cloud-layout-migration.json; rm -rf /storage/.cache/cloud_sync/scan' || return 1
 "$R/tools/cloud-test-backend" reset >/dev/null || return 1
 conf /ROCKNIX/Saves /ROCKNIX/Backups /ROCKNIX/Content >/dev/null || return 1
 mkdir -p "$DATA/ROCKNIX/Saves/gb" "$DATA/ROCKNIX/Backups/QA" "$DATA/ROCKNIX/Saves-replaced/gb" "$DATA/ROCKNIX/Content/ROMs/gb"
 printf 'save bytes\n' > "$DATA/ROCKNIX/Saves/gb/A.srm"
 printf 'settings bytes\n' > "$DATA/ROCKNIX/Backups/QA/settings.tar.gz"
 printf 'previous progress\n' > "$DATA/ROCKNIX/Saves-replaced/gb/A.srm"
 printf 'game bytes\n' > "$DATA/ROCKNIX/Content/ROMs/gb/A.gb"
}
protocol_snapshot() {
 python3 - "$DATA" <<'PY'
import hashlib,json,sys
from pathlib import Path
root=Path(sys.argv[1])
print(json.dumps({str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest()
                 for p in sorted(root.rglob('*')) if p.is_file()},sort_keys=True))
PY
}
protocol_pointers() { G_ "grep -E '^(SAVES|SETTINGS|CONTENT)_REMOTE=|^LAYOUT_KEEP=' $CONF"; }
protocol_payloads() { # pending: at least one intact copy; complete: current only
 python3 - "$DATA" "$1" <<'PY'
from pathlib import Path
import sys
root=Path(sys.argv[1]); complete=sys.argv[2]=='complete'
payloads={'Saves/gb/A.srm':b'save bytes\n','Backups/QA/settings.tar.gz':b'settings bytes\n',
          'Saves-replaced/gb/A.srm':b'previous progress\n','Content/ROMs/gb/A.gb':b'game bytes\n'}
for name,data in payloads.items():
    old,new=(root/r/name for r in ('ROCKNIX','pixelelated'))
    if complete:
        assert new.is_file() and new.read_bytes()==data and not old.exists(), name
    else:
        assert any(p.is_file() and p.read_bytes()==data for p in (old,new)), name
PY
}
protocol_call() { # tag, remote command; keep its real status, including a fault
 local tag="$1"; shift
 G_ "$@" > "$P/logs/$tag.log" 2>&1; PROTOCOL_RC=$?
 printf '%s\n' "$PROTOCOL_RC" > "$P/logs/$tag.rc"
}
protocol_main() {
 protocol_init || { check 1 'provider fault shim installed and selected'; return; }
 local kind="$1" operation stage tag remote before pointers
 remote=$(G_ '/usr/bin/rclone listremotes | head -1')
 # This value comes from the local QA backend installed by the parent runner.
 [[ "$remote" =~ ^[A-Za-z0-9_-]+:$ ]] || { check 1 'QA remote name'; return; }
 if [ "$kind" = T23 ]; then
  for operation in copy delete rcat; do
   for stage in Backups Saves Saves-replaced Content marker; do
    if [ "$operation" = rcat ]; then [ "$stage" = marker ] || continue
    else [ "$stage" != marker ] || continue; fi
    tag="T23-$operation-$stage"
    protocol_reset || { check 1 "$tag fixture reset"; return; }
    if [ "$stage" = marker ]; then
     G_ "printf '%s\n' '$operation ${remote}/pixelelated/.layout' > /tmp/cloud-epic-protocol/fault"
    else
     G_ "printf '%s\n' '$operation ${remote}/ROCKNIX/$stage' > /tmp/cloud-epic-protocol/fault"
    fi
    protocol_call "$tag-fault" '/usr/bin/cloud_migrate_layout --apply'
    [ "$PROTOCOL_RC" -ne 0 ]; check $? "$tag returns failure"
    G_ 'test -s /tmp/cloud-epic-protocol/fired'; check $? "$tag reaches injected provider operation"
    [ ! -e "$DATA/pixelelated/.layout" ]; check $? "$tag has no completion marker"
    protocol_payloads pending; check $? "$tag preserves every payload"
    protocol_pointers > "$P/logs/$tag-pointers-before.txt"
    G_ '/usr/bin/cloud_migrate_layout --needs-step && /usr/bin/cloud_scan --folder && grep -qx STATE=migration-pending /storage/.cache/cloud_sync/scan/state' > "$P/logs/$tag-pending.log" 2>&1
    check $? "$tag offered for retry by boot and scan"
    G_ 'rm -f /tmp/cloud-epic-protocol/fault'
    protocol_call "$tag-retry" '/usr/bin/cloud_migrate_layout --apply'
    [ "$PROTOCOL_RC" -eq 0 ]; check $? "$tag retry completes"
    protocol_payloads complete; check $? "$tag retry retains current bytes without old duplicates"
    cmp -s "$DATA/pixelelated/.layout" <(printf 'layout=2\n'); check $? "$tag publishes exact marker"
    G_ 'test ! -e /storage/.config/cloud-layout-migration.json'; check $? "$tag clears completed local record"
    protocol_snapshot > "$P/logs/$tag-cloud.json"; before=$(protocol_snapshot); pointers=$(protocol_pointers)
    protocol_call "$tag-repeat" '/usr/bin/cloud_migrate_layout --apply'
    [ "$PROTOCOL_RC" -eq 0 ] || [ "$PROTOCOL_RC" -eq 3 ]; check $? "$tag repeat succeeds"
    [ "$(protocol_snapshot)" = "$before" ] && [ "$(protocol_pointers)" = "$pointers" ]; check $? "$tag repeat changes no bytes/pointers"
    conf /ROCKNIX/Saves /ROCKNIX/Backups /ROCKNIX/Content >/dev/null
    protocol_call "$tag-follow" '/usr/bin/cloud_migrate_layout --follow'
    [ "$PROTOCOL_RC" -eq 0 ]; check $? "$tag clean follower configuration follows"
    G_ "grep -qx 'SAVES_REMOTE=\"/pixelelated/Saves\"' $CONF"; check $? "$tag follower points at current saves"
    [ "$(protocol_snapshot)" = "$before" ]; check $? "$tag follower changes no cloud bytes"
   done
  done
 elif [ "$kind" = T26 ]; then
  for stage in malformed future trailing; do
   for operation in apply follow settle seed scan; do
    tag="T26-$stage-$operation"
    protocol_reset || { check 1 "$tag fixture reset"; return; }
    mkdir -p "$DATA/pixelelated/Saves"
    case "$stage" in
     malformed) printf 'layout=banana\n';; future) printf 'layout=999\n';; trailing) printf 'layout=2\nextra=unrecognized\n';;
    esac > "$DATA/pixelelated/.layout"
    before=$(protocol_snapshot); pointers=$(protocol_pointers)
    case "$operation" in
     seed) protocol_call "$tag" '/usr/bin/cloud_setup --seed-folders';;
     scan) protocol_call "$tag" '/usr/bin/cloud_scan --folder';;
     *) protocol_call "$tag" "/usr/bin/cloud_migrate_layout --$operation";;
    esac
    [ "$PROTOCOL_RC" -ne 0 ]; check $? "$tag refuses unsupported layout"
    [ "$(protocol_snapshot)" = "$before" ] && [ "$(protocol_pointers)" = "$pointers" ]; check $? "$tag changes no bytes/pointers"
   done
  done
 elif [ "$kind" = T19 ]; then
  protocol_reset || { check 1 'T19 fixture reset'; return; }
  G_ 'cp -p /storage/.config/rclone/rclone.conf /tmp/cloud-epic-protocol/remote.saved; : > /storage/.config/rclone/rclone.conf; mkdir -p /storage/qa-not-a-cloud/gb /storage/roms/gb; printf "local-only sentinel\n" > /storage/qa-not-a-cloud/gb/QAUnlinkedRemote.srm; printf "local progress\n" > /storage/roms/gb/QAUnlinkedLocal.srm' || { check 1 'T19 empty-config fixture'; return; }
  conf /storage/qa-not-a-cloud /storage/qa-not-a-cloud/backup '' >/dev/null
  before=$(protocol_snapshot); pointers=$(protocol_pointers)
  for operation in cloud_backup cloud_restore; do
   for stage in direct automatic; do
    tag="T19-$operation-$stage"
    local automatic=""; [ "$stage" != automatic ] || automatic=--automatic
    protocol_call "$tag" "/usr/bin/$operation --yes --saves-only $automatic"
    [ "$PROTOCOL_RC" -ne 0 ] && grep -q "YOUR CLOUD STORAGE ISN'T SET UP YET" "$P/logs/$tag.log"; check $? "$tag refuses with setup outcome"
    G_ 'test ! -e /storage/qa-not-a-cloud/gb/QAUnlinkedLocal.srm && test ! -e /storage/roms/gb/QAUnlinkedRemote.srm && test "$(cat /storage/qa-not-a-cloud/gb/QAUnlinkedRemote.srm)" = "local-only sentinel"'; check $? "$tag does not treat a local path as cloud storage"
    [ "$(protocol_snapshot)" = "$before" ] && [ "$(protocol_pointers)" = "$pointers" ]; check $? "$tag changes no cloud bytes/pointers"
   done
  done
 else
  protocol_reset || { check 1 'T17 fixture reset'; return; }
  before=$(protocol_snapshot); pointers=$(protocol_pointers)
  G_ "printf '%s\n' 'lsd $remote' > /tmp/cloud-epic-protocol/fault"
  protocol_call T17-failed '/usr/bin/cloud_setup --seed-folders'
  [ "$PROTOCOL_RC" -ne 0 ]; check $? 'T17 failed settlement is returned'
  G_ 'test -s /tmp/cloud-epic-protocol/fired'; check $? 'T17 fault reached settlement provider probe'
  [ "$(protocol_snapshot)" = "$before" ] && [ "$(protocol_pointers)" = "$pointers" ]; check $? 'T17 no seeding or pointer writes on failure'
  G_ 'rm -f /tmp/cloud-epic-protocol/fault'
  protocol_call T17-recovered '/usr/bin/cloud_setup --seed-folders'
  [ "$PROTOCOL_RC" -eq 0 ]; check $? 'T17 later setup can recover'
  protocol_payloads pending; check $? 'T17 existing payloads survive recovery'
 fi
}
