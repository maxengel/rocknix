# ROCKNIX x64 Boot Issues - Comprehensive Fix Checklist

## Overview
This document catalogs all boot issues identified from the boot log analysis and provides a systematic implementation plan to fix each issue without disabling any services.

## Issues Categorized by Phase

### **Phase 1: Enhanced Plymouth Communication (095 layer)**

#### Issues Identified:
# X64 Boot Issues Comprehensive Fix Checklist

## Overview
This document tracks the systematic implementation of boot issue fixes across all x64 devices based on analysis of boot-test-with-fixes.log.

## Issue Categories and Fix Phases

### Phase 1: Plymouth Communication Fixes (095-plymouth-communication-fixes)
**Issues**: "Failed to communicate with plymouth: Connection refused"
**Root Cause**: Plymouth boot splash service communication failures
**Solution**: Fix D-Bus communication, add coordination, implement VM fallbacks

- [x] Generic x86_64
- [x] QEMU GUEST
- [x] QEMU Standard PC (Q35 + ICH9, 2009)
- [x] QEMU Standard PC (i440FX + PIIX, 1996)
- [x] VMware, Inc.
- [x] innotek GmbH VirtualBox
- [x] Valve Jupiter
- [x] ASUS ROG Ally RC71L_RC71L
- [x] Framework Laptop 13 (AMD Ryzen 7040Series)
- [x] Intel NUC
- [x] LENOVO
- [x] MSI Claw A1M
- [x] System76
- [x] To be filled by O.E.M.
- [ ] `plymouth-start.service` communication failures  
- [ ] Boot splash coordination problems
- [ ] Plymouth socket readiness timing issues

#### Implementation Plan:
- [ ] Create 095-plymouth-communication-fixes for all x64 devices
- [ ] Add D-Bus communication coordination between plymouth and systemd
- [ ] Implement fallback mechanisms when plymouth socket isn't ready
- [ ] Improve service ordering dependencies
- [ ] Add conditional plymouth handling for virtualized environments

### **Phase 2: SystemD Configuration Cleanup (096 layer)**

#### Issues Identified:
- [ ] `Support for option SystemCallFilter= has been disabled at compile time and it is ignored`
- [ ] `Support for option MemoryDenyWriteExecute= has been disabled at compile time and it is ignored`
- [ ] `Support for option RestrictAddressFamilies= has been disabled at compile time and it is ignored`
- [ ] `Support for option RestrictRealtime= has been disabled at compile time and it is ignored`
- [ ] `Support for option RestrictSUIDSGID= has been disabled at compile time and it is ignored`
- [ ] `Support for option LockPersonality= has been disabled at compile time and it is ignored`
- [ ] `Support for option SystemCallArchitectures= has been disabled at compile time and it is ignored`
- [ ] Multiple other compile-time disabled security options

#### Implementation Plan:
- [ ] Create 096-systemd-security-overrides for all x64 devices
- [ ] Remove unsupported security options from service configurations
- [ ] Provide alternative security mechanisms that work with current systemd build
- [ ] Create service overrides to eliminate warning messages

### **Phase 3: File Descriptor & D-Bus Improvements (097 layer)**

#### Issues Identified:
- [ ] `systemd-journald.service: Received EPOLLHUP on stored fd` (multiple occurrences)
- [ ] `Connection reset by peer` in service communications
- [ ] `Bus private-bus-connection: changing state RUNNING → CLOSING`
- [ ] File descriptor closure issues during service transitions
- [ ] D-Bus connection stability problems

#### Implementation Plan:
- [ ] Create 097-dbus-fd-improvements for all x64 devices
- [ ] Improve journald file descriptor management
- [ ] Add retry mechanisms for D-Bus connections
- [ ] Enhance connection stability with proper error handling
- [ ] Implement better file descriptor lifecycle management

### **Phase 4: Mount Configuration Management (098 layer)**

#### Issues Identified:
- [ ] `run-systemd-journal-socket.mount: Failed to load configuration: No such file or directory`
- [ ] `var-lib.mount: Failed to load configuration: No such file or directory`
- [ ] `var-lib-systemd.mount: Failed to load configuration: No such file or directory`
- [ ] `var-lib-systemd-linger.mount: Failed to load configuration: No such file or directory`
- [ ] `run-systemd-users.mount: Failed to load configuration: No such file or directory`
- [ ] `run-systemd-shutdown.mount: Failed to load configuration: No such file or directory`
- [ ] `run-systemd-sessions.mount: Failed to load configuration: No such file or directory`
- [ ] Multiple other mount configuration failures

#### Implementation Plan:
- [ ] Create 098-mount-configuration-fixes for all x64 devices
- [ ] Create proper mount unit configurations for required mountpoints
- [ ] Add conditional mount handling for virtualized environments
- [ ] Implement proper dependency chains for mount units

### **Phase 5: Service Lifecycle Coordination (099 layer)**

#### Issues Identified:
- [ ] `systemd-logind.service: Changed running -> stop-sigterm`
- [ ] Service restart/stop cycles without clear cause
- [ ] D-Bus name ownership changes causing service instability
- [ ] Service dependency chain issues

#### Implementation Plan:
- [ ] Create 099-service-lifecycle-coordination for all x64 devices
- [ ] Improve service dependency chains to prevent premature shutdowns
- [ ] Add proper service coordination mechanisms
- [ ] Enhance D-Bus service lifecycle management
- [ ] Implement service restart policies with proper backoff

### **Phase 6: Virtualization-Specific Fixes (100 layer)**

#### Issues Identified:
- [ ] `nbd*: Device busy: SYSTEMD_READY property from device is false` (multiple nbd devices)
- [ ] Virtual block device coordination problems
- [ ] VM-specific hardware detection issues

#### Implementation Plan:
- [ ] Create 100-virtualization-fixes for all x64 devices
- [ ] Add proper udev rules for virtual block devices
- [ ] Improve device detection and readiness coordination
- [ ] Add VM-specific service configurations

## Device Coverage Matrix

### Devices to Update:
- [ ] Generic x86_64
- [ ] QEMU StandardPC
- [ ] QEMU Standard PC (i440FX + PIIX, 1996)
- [ ] QEMU Standard PC (Q35 + ICH9, 2009)
- [ ] VMware, Inc. VMware Virtual Platform
- [ ] innotek GmbH VirtualBox
- [ ] Valve Jupiter
- [ ] ASUSTeK COMPUTER INC. ROG Ally RC71L_RC71L
- [ ] Framework
- [ ] Intel Corporation NUC
- [ ] LENOVO 83E1
- [ ] Micro-Star International Co., Ltd. Claw A1M
- [ ] System76
- [ ] Advanced Micro Devices, Inc.

### Platform-Level Updates:
- [ ] AMD64 platform configurations
- [ ] GENERIC_X64 platform configurations

## Implementation Status

### Phase 1: Plymouth Communication
- [x] **Status**: COMPLETED
- [x] **Files Created**: 14/14 devices
- [ ] **Testing**: Pending

### Phase 2: SystemD Configuration Cleanup  
- [x] **Status**: COMPLETED
- [x] **Files Created**: 14/14 devices
- [ ] **Testing**: Pending

### Phase 3: File Descriptor & D-Bus Improvements
- [x] **Status**: COMPLETED
- [x] **Files Created**: 14/14 devices
- [ ] **Testing**: Pending

### Phase 4: Mount Configuration Management
- [x] **Status**: COMPLETED
- [x] **Files Created**: 14/14 devices
- [ ] **Testing**: Pending

### Phase 5: Service Lifecycle Coordination
- [x] **Status**: COMPLETED
- [x] **Files Created**: 14/14 devices
- [ ] **Testing**: Pending

### Phase 6: Virtualization-Specific Fixes
- [x] **Status**: COMPLETED
- [x] **Files Created**: 14/14 devices
- [ ] **Testing**: Pending

## Testing Protocol

### Per-Phase Testing:
- [ ] Build test after each phase
- [ ] Boot test in QEMU
- [ ] Log analysis for issue resolution
- [ ] Regression testing for existing functionality

### Final Integration Testing:
- [ ] Complete boot sequence test
- [ ] Service functionality verification
- [ ] Performance impact assessment
- [ ] Long-term stability testing

## Success Criteria

### Phase 1 Success:
- [ ] No "Failed to communicate with plymouth" messages
- [ ] Smooth boot splash transitions
- [ ] Proper plymouth service coordination

### Phase 2 Success:
- [ ] No systemd compile-time option warnings
- [ ] Clean service configuration loading
- [ ] Maintained security where possible

### Phase 3 Success:
- [ ] No EPOLLHUP file descriptor issues
- [ ] Stable D-Bus connections
- [ ] No "Connection reset by peer" errors

### Phase 4 Success:
- [ ] All mount units load successfully
- [ ] Proper filesystem hierarchy setup
- [ ] No mount configuration errors

### Phase 5 Success:
- [ ] Services maintain proper lifecycle
- [ ] No premature service shutdowns
- [ ] Stable D-Bus name ownership

### Phase 6 Success:
- [ ] Virtual devices properly detected
- [ ] No NBD device readiness issues
- [ ] VM-optimized service behavior

## Overall Success Criteria:
- [ ] **Zero** service disabling as solutions
- [ ] Clean boot to "Configuring user interface" stage
- [ ] All identified issues resolved
- [ ] No regression in existing functionality
- [ ] Improved boot time and stability
