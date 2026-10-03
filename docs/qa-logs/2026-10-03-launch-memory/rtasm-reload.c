#define _GNU_SOURCE
#include <assert.h>
#include <dlfcn.h>
#include <pthread.h>
#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
static void *(*alloc_code)(size_t);
static void (*free_code)(void *);
static long executable_kib(void) {
  FILE *f=fopen("/proc/self/maps","r"); assert(f);
  char line[1024], mode[5]; unsigned long a,b; long result=0;
  while(fgets(line,sizeof(line),f))
    if(sscanf(line,"%lx-%lx %4s",&a,&b,mode)==3 && !strcmp(mode,"rwxp")) result+=(b-a)/1024;
  fclose(f); return result;
}
static void *worker(void *tag) {
  for(int i=0;i<100;i++) {
    unsigned char *a=alloc_code(4096), *b=alloc_code(8192); assert(a && b);
    memset(a,(int)(uintptr_t)tag,4096); memset(b,0x5a,8192);
    free_code(b);
    for(int j=0;j<4096;j++) assert(a[j]==(unsigned char)(uintptr_t)tag);
    free_code(a);
  }
  return NULL;
}
int main(int argc,char **argv) {
  assert(argc==2); long baseline=executable_kib();
  for(int i=0;i<50;i++) {
    void *dso=dlopen(argv[1],RTLD_NOW|RTLD_LOCAL);
    if(!dso) {fprintf(stderr,"%s\n",dlerror());return 2;}
    alloc_code=dlsym(dso,"rtasm_exec_malloc"); free_code=dlsym(dso,"rtasm_exec_free"); assert(alloc_code && free_code);
    pthread_t threads[4];
    for(int n=0;n<4;n++) assert(!pthread_create(&threads[n],NULL,worker,(void *)(uintptr_t)(n+1)));
    for(int n=0;n<4;n++) assert(!pthread_join(threads[n],NULL));
    assert(!dlclose(dso));
    printf("cycle=%d retained_executable_kib=%ld\n",i+1,executable_kib()-baseline);
  }
  return executable_kib()!=baseline;
}
