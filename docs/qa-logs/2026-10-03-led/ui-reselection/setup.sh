#!/bin/sh
set -e
systemctl stop essway
. /etc/profile >/dev/null 2>&1
cp "$J_CONF" /storage/m7-led/system.cfg.before
set_setting led.color rgb
set_setting led.brightness mid
set_setting analogsticks.led ""
for side in l r; do
 for n in 1 2 3 4; do
  dir="/storage/m7-led/sys/multi-led${side}${n}/leds/rgb:${side}${n}"
  mkdir -p "$dir"
  echo 0 > "$dir/brightness"
  echo '0 0 0' > "$dir/multi_intensity"
 done
done
mkdir -p /storage/m7-led/battery
echo 75 > /storage/m7-led/battery/capacity
echo Discharging > /storage/m7-led/battery/status
chmod +x /storage/m7-led/ledcontrol /storage/m7-led/ledcontrol-record /storage/m7-led/analog_sticks_ledcontrol /storage/m7-led/battery_led_status /storage/m7-led/emulationstation-led
mount --bind /storage/m7-led/ledcontrol-record /usr/bin/ledcontrol
mount --bind /storage/m7-led/analog_sticks_ledcontrol /usr/bin/analog_sticks_ledcontrol
mount --bind /storage/m7-led/battery_led_status /usr/bin/battery_led_status
umount /usr/bin/emulationstation
mount --bind /storage/m7-led/emulationstation-led /usr/bin/emulationstation
: > /storage/m7-led/calls.log
systemctl start essway
