set pagination off
set confirm off
set print thread-events off
set print frame-arguments none
set debuginfod enabled off
attach 1435
catch syscall mmap
condition 1 $rsi == 10485760
commands 1
silent
printf "10MiB mmap: addr=%p len=%ld protection=%ld flags=%ld\n", $rdi, $rsi, $rdx, $r10
bt 24
detach
quit
end
continue
