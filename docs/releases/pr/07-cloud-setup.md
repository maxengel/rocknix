Title: rclone: cloud storage set up on the device, with a sign-in window and a phone's QR code

Cloud storage is set up from the couch. CONNECT OR REPAIR CLOUD STORAGE lists the providers rclone supports, a recommended shortlist first; a form asks each provider's questions in the player's words; Dropbox, Google Drive and OneDrive sign in on the provider's own page in a single-purpose web view that refuses to leave the provider's host, typed on the on-screen keyboard or from the player's phone through a QR code (the phone is a keyboard, never where the sign-in happens); the connection is kept only once the provider answers. A remote made by a sign-in the player abandoned is removed. The device's stable name in the cloud comes from `cloud_device_id`, so two devices never overwrite one another's backups.

**What it carries.** `cloud_setup`, `cloud_remote`, `cloud_oauth`, `cloud_device_id`, `cloud_net_ready`; `cloud-signin-window` (a WebKitGTK view, one host, no address bar) and the web stack it needs, new to the tree: webkitgtk 2.54 with two build patches, libsoup, libpsl, glib-networking, gnutls pointed at the shipped CA bundle, libtasn1, woff2, harfbuzz-icu, openjpeg, brotli, ruby, unifdef, and GStreamer with its base and bad plugin sets; qrencode for the code on screen; and `rclone/package.mk`, which moves rclone to 1.75.1 and installs every cloud script, this PR's and the saves PR's (one file).

**How it was tested.** The sign-in flow on the x86_64 VM with a QA account and the page-lifetime checks under AddressSanitizer; the sign-in window's memory measured on the VM; the provider forms' text rules in the interface's unit tests; on an RG35XX SP, the maintainer's own Dropbox connected from the device. `cloud_net_ready` waits while a link comes up, proven with the link cut and restored on the VM.

**What it does not touch.** Which files move, and when: the saves PR. Syncthing.

**Kernel, bootloader or device tree.** None.

**Depends on.** PR 5 (the network scripts; `cloud_net_ready` reads the same truth).
