"""Exercise installed backuptool with a scoped exported tar fault function."""
from pathlib import Path
common=Path('/workspace/tmp/rasteratops-m7-archives-01/archive-proof.py').read_text()
exec(compile(common.split('bid=guest(')[0],'<retained archive proof helpers>','exec'))
check(guest("sed -n 's/^BUILD_ID=//p' /etc/os-release").strip('"')=='134e89c4fcb08581f1c831229167364828a37e27','exact replacement BUILD_ID')
guest('systemctl stop essway; set_setting cloudsaves.startup 0; set_setting cloudsaves.gameexit 0')
# All prior overlay archives remain preserved; the RC2 backing disk is untouched.
guest('mkdir -p /storage/roms/backup/m7-before-recovery\nfind /storage/roms/backup -maxdepth 1 -type f -exec mv -n {} /storage/roms/backup/m7-before-recovery/ \\;\nif [ -d /storage/roms/backup/archive ]; then mv /storage/roms/backup/archive /storage/roms/backup/m7-before-recovery/archive; fi\nmkdir -p /storage/roms/backup/archive\nprintf "LOCATIONS=( /storage/.config/m7-archive-sentinel )\\n" > /storage/.config/backuptool.conf')
conf()
records=[]
for suffix in ['ROCKNIX','RASTERATOPS']:
    guest("printf 'restored-"+suffix+"\\n' > /storage/.config/m7-archive-sentinel\nbackuptool backup")
    path=guest("find /storage/roms/backup -maxdepth 1 -type f -name '*_SETTINGS.tar.gz' | sort | tail -1")
    target='/storage/roms/backup/2026_10_03-233000-GENERIC-X64-'+suffix+'_SETTINGS.tar.gz'
    guest('mv '+q(path)+' '+q(target))
    digest=sha(target)
    # Future-dated histories model a clock behind cloud history. Active recovery
    # snapshot must survive although its timestamp sorts before these three.
    seeded=[]
    for i in range(1,5):
        n=f'/storage/roms/backup/archive/2030_01_0{i}-120000-GENERIC-X64-'+('ROCKNIX' if i%2 else 'RASTERATOPS')+'_SETTINGS.tar.gz'
        guest('cp '+q(target)+' '+q(n));seeded.append(n)
    expected='before-failure-'+suffix
    guest("printf '%s\\n' "+q(expected)+' > /storage/.config/m7-archive-sentinel')
    before=sha('/storage/.config/m7-archive-sentinel')
    fault='''
export M7_FAULT_ARCHIVE=TARGET
export M7_FAULT_FIRED=/tmp/m7-tar-fault-fired
rm -f "$M7_FAULT_FIRED" /tmp/m7-tar-before-revert
# Only this backuptool subprocess inherits the function; no installed file changes.
tar() {
    command tar "$@"
    local task_rc=$?
    if [ "$1" = -xzf ] && [ "$2" = "$M7_FAULT_ARCHIVE" ] && [ ! -e "$M7_FAULT_FIRED" ]; then
        cat /storage/.config/m7-archive-sentinel > /tmp/m7-tar-before-revert
        touch "$M7_FAULT_FIRED"
        return 1
    fi
    return "$task_rc"
}
export -f tar
set +e
backuptool restore --no-restart
TASK_RC=$?
printf '\\nM7_RESTORE_RC=%s\\n' "$TASK_RC"
exit 0
'''.replace('TARGET',q(target))
    output=guest(fault)
    check('M7_RESTORE_RC=1' in output and 'YOUR SETTINGS ARE UNCHANGED' in output,suffix+' failed extraction reports truthful reverted outcome')
    check(guest('test -f /tmp/m7-tar-fault-fired; cat /tmp/m7-tar-before-revert')=='restored-'+suffix,suffix+' injected failure reached actual extraction and changed sentinel before revert')
    check(sha('/storage/.config/m7-archive-sentinel')==before,suffix+' automatic revert restores exact previous bytes')
    check(sha(target)==digest,suffix+' recovery preserves target archive')
    guest('test ! -e /storage/.config/.restore-in-progress')
    snapshots=guest("find /storage/roms/backup/archive -maxdepth 1 -type f -name '*PRE_RESTORE*' | sort").splitlines()
    check(bool(snapshots),suffix+' active snapshot survives newer-dated mixed history')
    snapshot=snapshots[-1]
    check(guest('tar -xOzf '+q(snapshot)+' storage/.config/m7-archive-sentinel')==expected,suffix+' retained snapshot contains recoverable original sentinel')
    names=guest('find /storage/roms/backup/archive -maxdepth 1 -type f | sort').splitlines()
    check(set(names)==set(seeded[1:]+[snapshot]),suffix+' trim keeps newest three histories plus protected active snapshot')
    guest('backuptool restore --no-restart')
    check(guest('cat /storage/.config/m7-archive-sentinel')=='restored-'+suffix,suffix+' clean retry restores selected compatible archive')
    guest("printf 'next-backup\\n' > /storage/.config/m7-archive-sentinel\nbackuptool backup")
    retained=guest('find /storage/roms/backup/archive -maxdepth 1 -type f | sort').splitlines()
    check(set(retained)==set(seeded[1:]),suffix+' ordinary backup enforces three histories by filename across both suffixes')
    root=guest("find /storage/roms/backup -maxdepth 1 -type f -name '*_SETTINGS.tar.gz' | sort").splitlines()
    check(len(root)==1 and root[0].endswith('-ROCKNIX_SETTINGS.tar.gz'),suffix+' new writer retains backward-compatible name')
    check(guest('tar -xOzf '+q(root[0])+' storage/.config/m7-archive-sentinel')=='next-backup',suffix+' final production archive lists back exact sentinel')
    records.append({'suffix':suffix,'selected':target,'archive_sha256':digest,'before_sentinel_sha256':before,'snapshot':snapshot,'protected_history':names,'final_history':retained,'writer':root[0]})
    (out/'recovery-cases.json').write_text(json.dumps(records,indent=2)+'\n')
    guest('mkdir -p /storage/roms/backup/m7-after-'+suffix+'\nfind /storage/roms/backup -maxdepth 1 -type f -exec mv {} /storage/roms/backup/m7-after-'+suffix+'/ \\;')
print('PASS installed local writer, partial extraction, automatic revert, clean retry and mixed-name retention',flush=True)
