#include <napi.h>
#include <iostream>

// C headers for libTemporal (SteveLib)
#include "cppsrc/libTemporal/TemporalLib.h"

Napi::Value ohSteveOhSteveGiveMeRandomness(const Napi::CallbackInfo& info) {
  // get steve to divulge magical temporal randomness from the brain of your device
  uint32_t OutLen = info[0].As<Napi::Number>().Int32Value();
  unsigned char* Output = (unsigned char*)malloc(OutLen);
  BookHitter *steve = bh_create();
  bh_hitbooks(steve, Output, OutLen);
  bh_free(steve);
  free(Output);

  return Napi::Buffer<unsigned char>::New(info.Env(), OutLen);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "ohSteveOhSteveGiveMeRandomness"),
              Napi::Function::New(env, ohSteveOhSteveGiveMeRandomness));
  return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)