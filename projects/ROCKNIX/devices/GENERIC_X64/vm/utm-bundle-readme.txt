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
   different network - but quit UTM completely first (Cmd-Q): UTM
   saves its own copy of the settings when it quits and would undo
   the change.

3. Start the VM. In ROCKNIX, open Cloud Setup and scan the QR code with
   your phone to link your cloud storage. If the phone asks for a
   username and password, both are shown on the ROCKNIX screen next to
   the QR code (scanning the QR usually skips this).

Troubleshooting

- The setup screen shows an address starting with 10.0.x, or an old
  address after a network change: quit UTM completely (Cmd-Q), run the
  script again, then start the VM. The script refuses to run while UTM
  is open because UTM would overwrite the change when it quits.
- The QR opens but the page never loads: make sure the phone is on the
  same Wi-Fi network as this Mac.
