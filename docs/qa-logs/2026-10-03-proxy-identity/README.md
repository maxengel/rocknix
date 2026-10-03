# Packaged proxy identity — #408/#383

Exact replacement134e89 reproduces a real discovery failure. Its installed
config.pyc reads OS_NAME="RASTERATOPS" but returns recognized_platform=false,
automatic_detected=false and automatic_credentials=false. The same synthetic
settings file explicitly supplied returns the correct synthetic account.
No real credential values were read or recorded; no provider was contacted.
The VM run ends1 as the retained negative control and stops its owned guest.

Patch018 recognizes complete ROCKNIX and RASTERATOPS OS_NAME records while
preserving their shared /storage paths. Seven isolated identity/discovery
controls pass, including overrides, other names, comments, partial field names
and missing release files; old code fails the branded identity. Each case has
its own database so a previous cached sign-in cannot hide failed discovery.
36 relevant upstream platform/config/auth tests and eight fork preparation/
predecessor-state integration tests pass. Patch applies with fuzz0; pkgcheck
passes. The small config/test patch is also prepared under docs/upstream/
raofflineproxy/rasteratops-identity, not submitted. Rebuilt packaged-code
qualification and service/state preservation remain required.
