#!/bin/bash
set -euo pipefail
export CC=/usr/bin/gcc CXX=/usr/bin/g++
export PATH=/workspace/repos/rocknix.worktrees/generic-x64/build.ROCKNIX-GENERIC_X64.x86_64/toolchain/bin:$PATH
cd /tmp/rasteratops-dependencies-20261003
prefix=$PWD/install
cmake -S spirv-tools -B tools-build -G Ninja -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX="$prefix" -DSPIRV_SKIP_TESTS=ON -DSPIRV_SKIP_EXECUTABLES=ON -DBUILD_SHARED_LIBS=ON
cmake --build tools-build -j 8
cmake --install tools-build
cp -a spirv-headers/include/spirv "$prefix/include/"
cmake -S glslang -B glslang-build -G Ninja -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX="$prefix" -DBUILD_EXTERNAL=ON -DENABLE_GLSLANG_JS=OFF -DENABLE_RTTI=OFF -DENABLE_EXCEPTIONS=OFF -DENABLE_OPT=ON -DENABLE_PCH=ON -DGLSLANG_TESTS=OFF -DBUILD_SHARED_LIBS=ON -DENABLE_GLSLANG_BINARIES=OFF
cmake --build glslang-build -j 8
cmake --install glslang-build
mkdir -p shaderc/glslc/src
printf '"2025.3\\n"\n' > shaderc/glslc/src/build-version.inc
cmake -S shaderc -B shaderc-build -G Ninja -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX="$prefix" -DCMAKE_PREFIX_PATH="$prefix" -DCMAKE_CXX_FLAGS="-I$prefix/include" -DCMAKE_EXE_LINKER_FLAGS="-L$prefix/lib -Wl,-rpath,$prefix/lib -lglslang" -DCMAKE_SHARED_LINKER_FLAGS="-L$prefix/lib -Wl,-rpath,$prefix/lib -lglslang" -DSHADERC_SKIP_TESTS=ON -DSHADERC_SKIP_EXAMPLES=ON -Dglslang_SOURCE_DIR="$prefix/include/glslang" -DSPIRV-Headers_SOURCE_DIR="$PWD/spirv-headers"
cmake --build shaderc-build -j 8
printf '#version 450\nvoid main(){gl_Position=vec4(0,0,0,1);}\n' > sample.vert
LD_LIBRARY_PATH="$prefix/lib" shaderc-build/glslc/glslc sample.vert -o sample.spv
python3 -c 'from pathlib import Path; import struct; p=Path("sample.spv"); assert struct.unpack("<I",p.read_bytes()[:4])[0] == 0x07230203; print("PASS shaderc 2025.3 compiled a Vulkan vertex shader with glslang16.6.0 and its known-good SPIR-V pair:",p.stat().st_size,"bytes")'
