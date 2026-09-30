# Issue #337: The fork's own identity: the name, the branding the licence requires, sponsorships without a community, the site and the releases

Opened 2026-09-29T23:20:07Z

**Maintainer, 2026-09-29 (chat, D-QA-012), and later the same evening on sponsorships:** *"I also don't need to accept sponsorship. I really don't care either way. If at some point I wanted a Patreon or something, I could do that. This is more about whether it would be about sponsoring my work, but then that's just actually creating more issues because I have sponsors to deal with. Let's strike that concept: no sponsorships here."* The first message: *"At a certain point, it might be easier to fork, create the version I want, not allow for contributors, enable GitHub sponsorships, and just quietly offer an alternative. I have no interest in a Discord server, managing a community, etc., but I am interested in having a better experience, even if it's mainly just for me. If others can enjoy it, all the better, but to put in a lot of work and then not have it upstreamed seems silly. I also have a name we could use for this."* -- *"pixelelated", where I own the domain as well.*

**What the fork's own identity takes**, from #334's licence read (the branding is CC BY-NC-SA and must not suggest ROCKNIX's endorsement) and the tree as it stands. Not started until D-WORKFLOW-081 is called.

1. **The name in the tree**: `distributions/ROCKNIX/` becomes `distributions/pixelelated/` (the options file's `DISTRONAME`, `OS_NAME`, the version), the update URL the updater reads pointed at the fork's own releases, the theme's logo and the splash replaced by artwork of the fork's own (the ROCKNIX images may not be reused as a fork's identity), the device pages' names where they say ROCKNIX, and a line in the fork's README and release notes: *a fork of ROCKNIX, itself a fork of JELOS*, with the credits kept whole. The kernel, bootloaders, device trees, quirks and every package stay as merged from `upstream/next`.
2. **The repositories**: the distribution fork renamed to match (GitHub redirects the old name), the EmulationStation fork likewise; issues on, pull requests unsolicited (a public repository cannot refuse them; a `CONTRIBUTING.md` says the project takes none and the template says so), no sponsorships of any kind (struck by the maintainer, below), no Discord and no community channel -- the releases page and the site are the whole surface.
3. **The site**: the domain the maintainer owns, a MkDocs site like rocknix.org's from the pages already written for it (`docs/configure/cloud-sync.md`, `networking.md`, `play/retro-achievements.md` in the site checkout), under the new name, in the maintainer's voice.
4. **The releases**: the same `tools/fork-publish-release` and notes as RC1 and RC2, under the new tag prefix and name; every image built from one head, proven on the VM first, on the devices with a yes.

Can this be done on the VM? Yes: an image that boots under the new name with its own splash on guest d is the proof; a device after, on its yes.

## Acceptance criteria

- [ ] The register row that calls the direction (D-WORKFLOW-081's answer) names the fork's name and the licence terms it keeps (GPL-2 and MIT kept whole; the CC BY-SA attribution line; no ROCKNIX images).
- [ ] A GENERIC_X64 image boots under the new name with its own splash and logo, `OS_NAME` and the updater's URL read from `/etc/os-release` and the updater's script on guest d (a frame and the two lines filed here).
- [ ] The site builds from the fork's pages under the domain, with the attribution on its front page (the build log's last line filed here).




---

## Comment by maxengel, 2026-09-29T23:28:18Z

**Maintainer, 2026-09-29, the last word on the identity for now:** *"I don't even love GitHub, and so if we were to self-host something like JJ or Forgejo, I'd be fine with that. I think the more control we have over the stack, the better."*

Noted as part of the fork's footing, not started. What it touches when it comes, read from the tree: the issue tracker (every `gh issue` call in the session tooling and the D-QA-012 paper trail live on GitHub issues; Forgejo's issues and API are close enough that `tools/box-check`, `tools/archaeology` and the sub-issue calls move with a client change), the releases (`tools/fork-publish-release` uses `gh release`; Forgejo has releases and an API), the CI (`.github/workflows/fork-checks.yml` is GitHub Actions; Forgejo Actions runs most of the same workflow syntax), the push guard (`.githooks/pre-push` is git's own hook and moves anywhere git does; **Jujutsu's push does not run git hooks**, so on jj the guard is re-homed into CI or a server-side hook, which Forgejo has), and the update path (the updater reads a releases page; the fork's own is whatever it points at). The estate already runs a Forgejo, which is the natural home. None of it blocks the rename or the runner; it is a move the tooling can make one client at a time.



---

## Comment by maxengel, 2026-09-29T23:28:58Z

**Maintainer, 2026-09-29:** *"If we need GitHub, that's fine too."* -- so the host is not a constraint either way; the fork stays on GitHub until moving buys something, and the tooling is kept host-agnostic where that is cheap.


---

## Comment by maxengel, 2026-09-29T23:46:56Z

**Maintainer, 2026-09-29:** *"Honestly, I'm happy building a better OS, even if it's just used by me. I have a feeling that there's a divergence of opinion, and I don't want to waste my time trying to figure out how to work with their system. We'll see what they come back with, but I kind of feel at this point we have a strong release candidate. We might be better off referring to this as version 0.0.1 of our new OS than considering it something we upstream."*

**What "0.0.1 of the new OS" is, in the tree, read tonight.** The name lives in five files under `distributions/ROCKNIX/` (`options` sets `DISTRONAME`, `version` sets `DISTRO_VERSION` and `OS_VERSION`, `logos/rocknix-logo.png`, `kernel_options`, `config/functions`); the updater asks an update endpoint by POST and follows the address it returns, so the fork's own endpoint or release page goes there; the boot splash and the theme's logo text are the artwork. RC2's images boot as ROCKNIX with ROCKNIX's logo, so they can be *called* 0.0.1 privately today and *published* as the new OS only after the rename and the artwork (the branding's licence). A rename is about a day: a `distributions/<name>/` with the four files and a wordmark, `OS_VERSION` as `0.0.1`, the updater's address, the theme patch's text, then the four images rebuilt from one head, the VM suites and the rehearsal, and the devices on a yes. The fork's release page carries `0.0.1` beside `rc2-20260929` with the attribution line.

**Version scheme, proposed:** `0.0.1` for this cut, `0.0.x` for fixes on it, `0.1` for the first cut that carries the fork's own direction (#336's step 0), so the number says what the build is rather than when it was made -- the date stays in the file names as now.

Nothing starts until the maintainer calls D-WORKFLOW-081; the generic fixes go to their own upstreams regardless, and one small PR to ROCKNIX is all *"see what they come back with"* costs.



---

## Comment by maxengel, 2026-09-30T01:25:08Z

**Maintainer, 2026-09-30:** *"I think I'm going to call it, 'rasteratops'. thoughts?"* -- Checked: no repository, user or organisation on GitHub matches it (0, 0, 0), and the web has no project by that name; the nearest is RasterOps, a Macintosh graphics-card maker founded in 1987 and long since renamed, and the rest of the results are ceratopsian dinosaurs. Eleven letters against ROCKNIX's seven, which the wordmark and the file names carry fine. *raster* is the pixel grid and the CRT scan, *-atops* the horned dinosaur, which hands the fork its logo: a pixel triceratops. The domain is the one thing not checked here. The name goes into D-WORKFLOW-081's deciding row when the maintainer confirms it.


---

## Comment by maxengel, 2026-09-30T01:31:36Z

**Maintainer, 2026-09-30:** *"i could also go with Rasteroid/RasteroidOS"* -- Checked: **rasteroid** is taken in every direction -- 17 GitHub repositories (Asteroids clones, a game controller, a sound server), 4 users or organisations including the user `rasteroid`, a solo game developer of that name on itch.io and GitHub, a former OpenGL ES middleware product called Rasteroid by Hybrid (Khronos news), a design studio and Instagram account called Rasteroids, and a SoundCloud artist. **RasteroidOS** has no match anywhere, but it lives one letter from all of the above and would be searched as *rasteroid*. **rasteratops** has zero matches on GitHub and none on the web. On collisions alone, rasteratops; the maintainer's ear decides the rest.


---

## Comment by maxengel, 2026-09-30T01:33:25Z

**Decided (D-WORKFLOW-084):** the fork is **rasteratops**. Maintainer, 2026-09-30: *"rasteratops it is. let me grab the GitHub org."* Phase B's organisation is the maintainer's; Phase A (the identity in the tree, on the VM first) follows the council's sitting on #338.


---

## Comment by maxengel, 2026-09-30T01:38:52Z

**Maintainer, 2026-09-30:** *"we can use this for the splash screen, until we have a logo: https://github.com/gissio/font_tiny5"* -- Tiny5 (gissio), a family of 5-pixel fonts under the SIL Open Font License 1.1, shipped as variable TTF/OTF and as BDF bitmaps, with a heavier *Tiny5 Duo* for titles; the OFL asks only that the font files keep their notice when redistributed, and an image rendered with it carries no obligation. The interim wordmark: *rasteratops* in Tiny5 Duo, one pixel per font pixel scaled by a whole number, centred on black at each panel size. The splash itself is a separate ROCKNIX repository (`rocknix-splash`, GPL, a small application pinned by commit in `projects/ROCKNIX/packages/tools/rocknix-splash/package.mk`), so Phase A forks that repository into the organisation, replaces its image with the wordmark, and points the recipe at the fork's commit.


---

## Comment by maxengel, 2026-09-30T01:40:33Z

**The interim wordmark is rendered** (`/workspace/tmp/rocknix-session/splash/`, not in the tree until Phase A): *rasteratops* in Tiny5 Duo from the font's own BDF bitmap, 58 x 6 font pixels, scaled nine times to 522 x 54 on a 640 x 480 black canvas, light grey; a 640 x 480 PNG preview and an SVG of 146 one-pixel squares. The splash application (`ROCKNIX/rocknix-splash`) draws no image file: its logo is SVG path data compiled into `main.c` (`svg_paths[]`, seven letter paths, four red and three grey) rendered by its own parser, which understands M, L, H, V, Z and cubic curves, and scales the drawing to the panel. So Phase A's splash is a fork of that repository with `svg_paths[]` replaced by the wordmark's one path (146 `M x y h1 v1 h-1 z` squares in a 58 x 6 box, generated and kept beside the preview) in one colour, and the recipe's pin moved to the fork's commit. A pixel triceratops takes the same route when it exists.


---

## Comment by maxengel, 2026-09-30T01:41:48Z

**Maintainer, 2026-09-30:** *"We can quickly come up with an SVG if we need to as well of the word rasteratops, looking like a triceratops"* -- Two pixel-art drafts of a triceratops head beside the wordmark are in `/workspace/tmp/rocknix-session/splash/` (`rasteratops-head-640x480.png`, an outline that reads as a rodent; `rasteratops-head2-640x480.png`, a solid silhouette that reads as a beast with a hump but not yet a triceratops). The mechanics are settled by them: any drawing on a pixel grid, up to about 32 x 20 cells, becomes the splash's one path and scales cleanly to every panel; an SVG the maintainer draws drops into the same route. What the animal needs at this size, for whoever draws it: a solid silhouette, not an outline; three horns two cells thick (two long brow horns forward and up, one short nose horn); a frill that stands off the head with a scalloped edge; a beak; one eye. The word stays as Tiny5 Duo draws it, since features worked into the letters read as noise at 640 x 480.


---

## Comment by maxengel, 2026-09-30T02:03:12Z

**Maintainer, 2026-09-30:** *"I can do the art. Tell me the resolution you definitely want, and I can work on that. If we're using Tiny 5 Duo, I can create an SVG and optimize for a pixel grid of 32x20 if that's our goal."*

**The panels, read from the devices:** the RG35XX SP, the RG SP, the RG353M and the VM draw at 640 x 480; the Retroid Pocket Nova at 1280 x 960 -- all 4:3, the Nova exactly twice the others. **The splash application** scales by floating point (60 % of the screen's width, a hard-coded 1284:500 aspect, the renderer's `min(scale_x, scale_y)`) with no whole-pixel snap, so its fork gets two one-line changes: the drawing's own box instead of 1284:500, and the scale rounded down to a whole number, so every cell lands on whole pixels.

**The specification, then:**

- **The logo (the animal): a 32 x 20 cell grid.** One main colour; one optional accent colour (the eye, or the horns), since the renderer colours per path; transparent background. Delivered as an SVG with `viewBox="0 0 32 20"` made of 1 x 1 `rect`s or of paths on whole-number coordinates only, no curves, no fractional edges. Facing the word (to the right) reads best beside it; facing left works above it.
- **The wordmark is not drawn:** *rasteratops* comes from Tiny5 Duo's own bitmap, 57 x 6 cells, generated.
- **The composition the splash draws:** a 64 x 32 canvas, the animal centred in rows 0-19, the word centred in rows 24-29. On 640 x 480 the fork's whole-number scale is 6 (384 x 192 on screen); on the Nova 12. The same logo SVG serves the theme's logo text, the release page and the site at any size, since it is cells.

The two drafts under `/workspace/tmp/rocknix-session/splash/` show the composition, not the animal.

