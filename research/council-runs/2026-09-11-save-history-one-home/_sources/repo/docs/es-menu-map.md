# EmulationStation menu map

Where every screen lives, so a new feature can be placed rather than invented.
Derived from `es-app/src/guis/` in `ROCKNIX/emulationstation-next` (surveyed
2026-08-19 against the `20260818` build) and verified against the running UI with
`tools/vm-visual-qa`.

Companion documents: [es-ui-style-guide.md](es-ui-style-guide.md) — how a screen
should look and behave once you know where it goes; and
[conflict-wizard-ia.md](conflict-wizard-ia.md) — the flow and screen structure
for the cloud-save conflict wizard (#23), now entering implementation — milestone "Cloud Saves: Visual Conflict Resolution".

## Two ways in

EmulationStation has **two** entry points, and they lead to different trees:

| Button | Opens | Purpose |
|---|---|---|
| **START** | MAIN MENU | Everything configurable |
| **SELECT** | QUICK ACCESS (system view) / VIEW OPTIONS (game list) | Context actions for what is on screen |

Both are built by the same code (`GuiMenu::openQuitMenu_static` serves QUIT and
QUICK ACCESS), which is why QUIT's rows appear inside QUICK ACCESS.

## Main menu

```mermaid
flowchart TD
    START([START button]) --> MM[MAIN MENU]

    MM --> RA[RETROACHIEVEMENTS]:::gated
    MM --> KODI[KODI MEDIA CENTER]:::gated
    MM --> FULL{{full UI only}}
    MM --> QUIT[QUIT]

    FULL --> GS[GAME SETTINGS]
    FULL --> CB[CONTROLLER &amp; BLUETOOTH SETTINGS]
    FULL --> UI[USER INTERFACE SETTINGS]
    FULL --> GC[GAME COLLECTION SETTINGS]
    FULL --> SND[SOUND SETTINGS]
    FULL --> NET[NETWORK SETTINGS]
    FULL --> SCR[SCRAPER]
    FULL --> UPD[UPDATES &amp; DOWNLOADS]
    FULL --> SYS[SYSTEM SETTINGS]

    MM -.kid / kiosk mode.-> KIOSK[INFORMATION<br/>UNLOCK USER INTERFACE MODE]

    classDef gated stroke-dasharray: 4 3
```

In **kid or kiosk mode the entire block above collapses** to INFORMATION,
UNLOCK USER INTERFACE MODE, RETROACHIEVEMENTS (if configured) and QUIT. Anything
you add to the full-UI block simply does not exist for those users — which is the
correct default for configuration, but check it deliberately.

## What lives where

The section headers (`addGroup`) are the real information architecture; use them
to decide where something belongs.

| Destination | Groups it contains |
|---|---|
| **GAME SETTINGS** | TOOLS · ACCOUNTS · BIOS SETTINGS · SAVESTATES · DEFAULT GLOBAL SETTINGS · **CLOUD SETTINGS** · SYSTEM SETTINGS (per-system config) |
| **CONTROLLER & BLUETOOTH** | SETTINGS · BLUETOOTH · DISPLAY OPTIONS · BEHAVIOR · PLAYER ASSIGNMENTS |
| **USER INTERFACE** | APPEARANCE · CONTROL OPTIONS · DISPLAY OPTIONS · GAMELIST OPTIONS · ICONS |
| **GAME COLLECTION** | COLLECTIONS TO DISPLAY · CREATE CUSTOM COLLECTION · OPTIONS |
| **SOUND** | VOLUME · MUSIC · SOUNDS |
| **NETWORK** | INFORMATION · SETTINGS · NETWORK SERVICES · SYNCTHING SERVICES · VPN SERVICES · FINISH RESTORE SETUP (only after a restore) — *no cloud group; D-UI-015/017* |
| **SCRAPER** | tabbed: SCRAPE · OPTIONS · ACCOUNTS |
| **UPDATES & DOWNLOADS** | DOWNLOADS · SOFTWARE UPDATES |
| **SYSTEM SETTINGS** | SYSTEM · HARDWARE · DEVICE · STORAGE · PERFORMANCE · TWEAKS · SUSPEND · LED HARDWARE · ADVANCED |

Two placement rules the existing tree already follows:

- **Read-only facts come before editable settings.** NETWORK SETTINGS opens with
  an INFORMATION group (IP address, internet status) and only then SETTINGS.
- **Destructive and system-level operations sit behind ADVANCED**, inside SYSTEM
  SETTINGS → SYSTEM MANAGEMENT AND RESET, where every row confirms first.

## Cloud (our subtree)

As built on 2026-09-11 (`af2db4ab09`, ES `98b1034c3`). One door:
`GAME SETTINGS > CLOUD SETTINGS`. The three save actions sit at that level
because saves move constantly; everything occasional is one row further in,
behind MANAGE CLOUD STORAGE (D-UI-021 lineage; the vocabulary is D-UI-022:
*saves*, *settings*, *ROMs and BIOS*; *back up* and *restore*). `NETWORK
SETTINGS` carries no cloud group. Rows are a label and at most one line
under it (D-UI-023); the line under a launching row is how it last went
(`LAST <date> - <outcome>`, D-UI-029), read uncached from
`/storage/.cache/cloud_sync/last-<name>`.

```mermaid
flowchart TD
    GS[GAME SETTINGS] --> CS{{CLOUD SETTINGS}}
    CS --> SYNC[SYNC SAVES WITH THE CLOUD<br/><i>LAST … - outcome</i>]
    CS --> UP[BACK UP SAVES TO THE CLOUD<br/><i>LAST … - outcome</i>]
    CS --> DOWN[RESTORE SAVES FROM THE CLOUD<br/><i>LAST … - outcome</i>]
    CS --> ALL[MANAGE CLOUD STORAGE]

    ALL --> HUB{{CLOUD}}
    HUB --> BR[BACKUP AND RESTORE]
    BR --> BU[BACK UP TO THE CLOUD] --> TICK[tick: SAVES · ROMS AND BIOS · SETTINGS<br/>CONTINUE]
    BR --> RE[RESTORE FROM THE CLOUD] --> TICK
    TICK -->|ROMS AND BIOS ticked| PICK[systems page<br/>select all · badge per system]
    TICK --> XFER[GuiCloudTransfer<br/>full-screen; live line, elapsed, outcome; stays until dismissed]
    PICK --> XFER
    BR --> MATCH[MATCH THIS DEVICE TO THE CLOUD<br/><i>the only action that deletes</i>] --> PREV[preview → confirm] --> XFER

    HUB --> SM[SAVE MANAGEMENT]
    SM --> ST[SYNC SAVES DURING STARTUP<br/><i>AT STARTUP - outcome</i>]
    SM --> GE[SYNC SAVES WHEN EXITING A GAME<br/><i>AFTER LAST GAME - outcome</i>]

    HUB --> CSS[CLOUD STORAGE SETUP]
    CSS --> CT[CONNECTED TO … <i>provider label</i>]
    CSS --> CHK[CHECK CONNECTION] --> CHKD[dialog: answers / does not]
    CSS --> FOLDER[CHANGE CLOUD FOLDER] --> KB[CLOUD FOLDER keyboard]
    CSS --> CONN[CONNECT OR REPAIR CLOUD STORAGE] --> LIST[CONNECT CLOUD STORAGE<br/>RECOMMENDED list · MORE]
    LIST --> FORM[provider form<br/>NAME · REQUIRED · OPTIONAL · FINISH: CONNECT<br/><i>labels in the player's words, D-UI-038</i>]
    LIST -->|S3| SUB[compatible service] --> FORM
    FORM -->|OAuth providers| OAUTH[sign in on device / with phone]
    CSS --> FIN[FINALIZE RESTORE<br/><i>only after a settings restore</i>]
    CSS --> TIDY[TIDY UP YOUR CLOUD FOLDERS<br/><i>only when something to move</i>]
```

**Dialogs the cloud raises on its own.** A restore against a cloud whose saves
folder is missing ends COMPLETED and offers to create it (D-CLOUD-085); when a
folder with a near name sits beside the missing one the dialog names both and
offers CHANGE FOLDER · CREATE ANYWAY · NOT NOW (D-CLOUD-091). BACK UP / RESTORE
on a device with no cloud storage asks SET IT UP NOW? and YES opens the list.
FINISH RESTORE SETUP (after a settings restore) tells the player the backup
never carried the cloud sign-in and points at MANAGE CLOUD STORAGE (D-CLOUD-087).

**Elsewhere, cloud-adjacent.** `SYSTEM SETTINGS > SYSTEM MANAGEMENT AND RESET`:
DATA MANAGEMENT (back up / restore settings to this device), EMULATOR
MANAGEMENT and SYSTEM MANAGEMENT (the resets) run headless behind a spinner and
end in an outcome dialog (D-UI-037). `SCRAPER > OPTIONS` carries DEVELOPER ID /
DEVELOPER PASSWORD beside the account (#64). The startup sync is a card at
boot; the exit sync a card after a game; both end on the card (D-UI-028) and a
launch cancels either (D-CLOUD-076).

Anything measured in minutes runs in `GuiCloudTransfer`, not a card
(`es-native-ui.md`, the fourth tier). Exit 75 from any script means another
sync held the lock and exit 69 means there was no network (sysexits'
`EX_TEMPFAIL` and `EX_UNAVAILABLE`, codes rclone cannot return -- #99); both
are shown as SKIPPED, not FAILED.

**Keep this map current.** Maintainer, 2026-09-11: it is *"something we were
maintaining closely and should still do"* -- every row added, moved or renamed
in EmulationStation updates this file in the same change (D-UI-039). Pending
here: #134's history store settings (nested under SAVE MANAGEMENT, not stacked
on the hub) and #23's KEEP DISCARDED SAVES rows, which share that nest.

## Screens you cannot reach from the main menu

These are entered from the game list or the launch flow, and are easy to forget
when reasoning about "where does the user see this?":

| Screen | Entered from |
|---|---|
| VIEW OPTIONS | SELECT in a game list |
| *(game name)* game options | long-press South / North in a game list |
| SAVESTATE MANAGER | game launch, when savestates are enabled |
| metadata editor, single-game scraper | game options |
| CONNECT TO NETPLAY | system view |
| QUICK ACCESS | SELECT in the system view |
| media viewers (manual, video) | game options, quick access |

## Adding a new destination

1. **Prefer an existing group.** Nearly everything belongs under a group that
   already exists; a new top-level main-menu entry is almost never right.
2. **A new top-level entry has no themed icon.** Theme `menuIcons` names are a
   fixed vocabulary (`iconSystem`, `iconUI`, `iconNetwork`, `iconAdvanced`, …),
   so an entry outside that list renders without one until upstream adds it.
3. **Check the mode gates.** Decide explicitly whether kid/kiosk users should see
   it, and whether it needs `isFullUI`.
4. **Gate on capability, not assumption** — `Utils::FileSystem::exists("/usr/bin/tool")`
   for OS-shipped scripts, `ApiSystem::isScriptingSupported(...)` for batocera-style
   backends.

## Upstream references

There is **no upstream documentation of menu structure or UX** — `THEMES.md`
covers only how a theme repaints menus (colors, fonts, switch/slider artwork).
The closest thing to a specification is the Batocera wiki's menu tree, which
enumerates the same top-level structure this fork ships:

- <https://wiki.batocera.org/menu_tree> — menu enumeration (de-facto placement spec)
- <https://wiki.batocera.org/emulationstation_overview> — interaction conventions
  (cardinal button names, South confirms / East cancels, help-bar rule)

ES-DE and RetroPie documentation describes *different* forks and does not apply.
