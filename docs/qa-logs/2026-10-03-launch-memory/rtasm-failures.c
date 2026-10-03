#define _GNU_SOURCE
#include <assert.h>
#include <dlfcn.h>
#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/mman.h>
#include <sys/types.h>
static int failed;
static int should_fail(const char *which) { if(!failed && getenv("M7_FAIL") && !strcmp(getenv("M7_FAIL"),which)) {failed=1; return 1;} return 0; }
void *__real_mmap64(void *,size_t,int,int,int,off64_t);
void *__wrap_mmap64(void *,size_t,int,int,int,off64_t);
void *__wrap_mmap64(void *p,size_t n,int prot,int flags,int fd,off64_t off) { if(should_fail("mmap")) {errno=ENOMEM; return MAP_FAILED;} return __real_mmap64(p,n,prot,flags,fd,off); }
void *__real_calloc(size_t,size_t);
void *__wrap_calloc(size_t,size_t);
void *__wrap_calloc(size_t n,size_t s) {if(should_fail("calloc")) return NULL; return __real_calloc(n,s);}
int __real_atexit(void (*)(void));
int __wrap_atexit(void (*)(void));
int __wrap_atexit(void (*fn)(void)) {if(should_fail("atexit")) return 1; return __real_atexit(fn);}
#ifdef DRIVER
static long executable_kib(void) {
 FILE *f=fopen("/proc/self/maps","r");assert(f);char line[1024],mode[5];unsigned long a,b;long sum=0;
 while(fgets(line,sizeof(line),f))if(sscanf(line,"%lx-%lx %4s",&a,&b,mode)==3 && !strcmp(mode,"rwxp"))sum+=(b-a)/1024;
 fclose(f);return sum;
}
int main(int argc,char **argv) {
 assert(argc==2); long before=executable_kib();void *lib=dlopen(argv[1],RTLD_NOW|RTLD_LOCAL);assert(lib);
 void *(*alloc)(size_t)=dlsym(lib,"rtasm_exec_malloc");void (*release)(void *)=dlsym(lib,"rtasm_exec_free");assert(alloc && release);
 assert(alloc(4096)==NULL);assert(executable_kib()==before);
 void *code=alloc(4096);assert(code);memset(code,0x90,4096);release(code);assert(!dlclose(lib));assert(executable_kib()==before);
 printf("PASS %s failure unwinds and retries without a retained arena\n",getenv("M7_FAIL"));return 0;
}
#endif
