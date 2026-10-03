set pagination off
set confirm off
set print frame-arguments none
attach 1435
catch unload libgallium
commands 1
 silent
 printf "Mesa DSO unload at game launch\n"
 bt 16
 detach
 quit
end
continue
