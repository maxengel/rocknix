# SPDX-License-Identifier: GPL-2.0
# Copyright (C) 2023 JELOS (https://github.com/JustEnoughLinuxOS)

PKG_NAME="ioport"
PKG_VERSION="1.2"
PKG_SHA256="7fac1c4b61eb9411275de0e1e7d7a8c3f34166f64f16413f50741e8fce2b8dc0"
PKG_LICENSE="GPL-2.0"
PKG_SITE="https://people.redhat.com/rjones/ioport/"
PKG_URL="http://deb.debian.org/debian/pool/main/i/ioport/ioport_${PKG_VERSION}.orig.tar.gz"
PKG_ARCH="x86_64"
PKG_DEPENDS_TARGET="toolchain"
PKG_LONGDESC="Access I/O ports - commands enable command line and script access directly to I/O ports on PC hardware."
PKG_TOOLCHAIN="manual"

make_target() {
  # Simple compilation approach since autotools has build order issues
  cd ${PKG_BUILD}
  
  # Debug: Show current directory and contents
  echo "DEBUG: Current directory: $(pwd)"
  echo "DEBUG: Directory contents: $(ls -la)"
  
  # Create a basic config.h file in the build directory
  cat > config.h << EOF
/* Generated config.h for ioport */
#define PACKAGE "ioport"
#define PACKAGE_NAME "ioport"
#define PACKAGE_VERSION "1.2"
#define PACKAGE_STRING "ioport 1.2"
#define PACKAGE_TARNAME "ioport"
#define VERSION "1.2"
EOF
  
  # Verify config.h exists and show its contents
  if [ ! -f config.h ]; then
    echo "ERROR: config.h not found in ${PKG_BUILD}"
    exit 1
  fi
  echo "DEBUG: config.h created successfully"
  echo "DEBUG: config.h contents:"
  cat config.h
  
  # Show what files are available for compilation
  echo "DEBUG: Available source files:"
  ls -la *.c *.h 2>/dev/null || echo "No .c or .h files found"
  
  # Compile the main binary
  echo "DEBUG: Compiling with command: ${CC} ${CFLAGS} ${LDFLAGS} -o inb port.c"
  ${CC} ${CFLAGS} ${LDFLAGS} -o inb port.c
}

makeinstall_target() {
  # Install the main binary
  mkdir -p ${INSTALL}/usr/bin
  cp ${PKG_BUILD}/inb ${INSTALL}/usr/bin/
  
  # Create symlinks for other commands
  for cmd in outb inw outw inl outl; do
    ln -sf inb ${INSTALL}/usr/bin/${cmd}
  done
}
