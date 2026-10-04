// Exercise the exact SVG parser embedded by EmulationStation, without a GPU.
#include <cassert>
#include <cstdio>
#include <set>
#define NANOSVG_IMPLEMENTATION
#include "nanosvg.h"
int main(int argc, char **argv) {
    assert(argc == 2);
    NSVGimage *image = nsvgParseFromFile(argv[1], "px", 96);
    assert(image && image->width == 480 && image->height == 256);
    unsigned paths = 0;
    std::set<unsigned> colors;
    for (NSVGshape *shape = image->shapes; shape; shape = shape->next) {
        assert(shape->fill.type == NSVG_PAINT_COLOR);
        assert(shape->opacity == 1);
        colors.insert(shape->fill.color);
        for (NSVGpath *path = shape->paths; path; path = path->next) {
            assert(path->closed && path->npts == 13);
            assert(path->bounds[0] >= 0 && path->bounds[1] >= 0);
            assert(path->bounds[2] < image->width && path->bounds[3] < image->height);
            ++paths;
        }
    }
    assert(paths == 258);
    const std::set<unsigned> expected = {
        0xFFFFFFA5u, 0xFFFFE610u, 0xFFFFA510u, 0xFFFF6319u, 0xFFB52119u
    };
    assert(colors == expected);
    nsvgDelete(image);
    puts("PASS: exact ES NanoSVG parser reads258 closed band pieces and all5 Ocean colors");
}
