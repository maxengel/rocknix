ROCKNIX GENERIC_X64 - UTM quick start
=====================================

1. Double-click the .utm file to add the VM to UTM
   (get UTM from https://mac.getutm.app if you don't have it).

2. Make the setup QR code work with your phone (recommended):

   Run set-up-phone-qr.command, found in this folder.

   The first launch needs one extra step, because macOS blocks
   downloaded scripts it doesn't recognize (Gatekeeper):

     - Right-click (or Control-click) set-up-phone-qr.command
     - Choose "Open"
     - In the warning dialog, click "Open" again

   If macOS only offers "Move to Trash" / "Done" (macOS 15 and newer):

     - Click "Done" (not "Move to Trash")
     - Open System Settings > Privacy & Security, scroll down
     - Next to the message about set-up-phone-qr.command, click
       "Open Anyway", then confirm

   After the first run, plain double-click works.

   What it does: your phone can only reach the VM through this Mac, so
   the script finds the Mac's network address and stores it in the VM's
   settings. The ROCKNIX cloud setup screen then shows a QR code your
   phone can actually open. Run it again whenever the Mac joins a
   different network (quit the VM first).

3. Start the VM. In ROCKNIX, open Cloud Setup and scan the QR code with
   your phone to link your cloud storage.

Troubleshooting

- The setup screen shows an address starting with 10.0.x: the script has
  not been run (or the VM was started before it finished). Quit the VM,
  run the script, start the VM again.
- The QR opens but the page never loads: make sure the phone is on the
  same Wi-Fi network as this Mac.
