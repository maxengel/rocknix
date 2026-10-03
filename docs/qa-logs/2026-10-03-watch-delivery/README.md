# Active-session watcher loss proof — #395

At21:14UTC, isolated owned host jobs exercised two failure modes alongside
(but without touching) replacement VM QA. The user was told each outcome
in the active conversation without asking for status.

- Killed runner: watcher records state=died; build.rc is absent. The owned
  sleep group is cleaned up, never by a process-name pattern.
- Killed monitor: actual command exits0, runner exits125 and writes the
  explicit runner-error that completion monitoring failed. A successful
  command cannot conceal a failed monitor.

Normal success and nonzero failure were already observed on actual M7 jobs
and the exit7 probe. These receipts establish distinct active-session result
observations, not delivery after the conversation disconnects. No external
destination was selected and no external message was sent. #395 remains
open for destination/receipt and delivery-failure handling; a status file is
not itself a notification. Durable run owners and source probe are retained.

At21:33UTC a separate deliberately quiet live job was observed as suspected
stalled, then finished rc0 without intervention. Test threshold0 minutes
accelerates the control; the real QA threshold remains5 minutes. Both
observations were announced in the active conversation. quiet-job/ retains
the actual two statuses and result. Quiet output never authorizes restart.

The full replacement link run returned143 through the outer tool session
despite both provider reports, candidate custody, build.rc and terminal
watcher status passing with0. No runner-error or watcher stderr exists.
A fresh isolated throttled-S3 up/down/EXIT-cleanup probe at9032 records0
in child, watcher, explicit outer-shell file and tool result. The original
discrepancy is retained in `../2026-10-03-replacement-links/outer-session.json`;
it is not reproduced or explained by this control. New job launches also
record outer.rc. Off-session delivery remains unconfigured.
