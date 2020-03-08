#include <napi.h>
#include <iostream>

// C headers for libTemporal (SteveLib)
#include "cppsrc/libTemporal/TemporalLib.h"

static BookHitter *steve;

Napi::Value ohSteveOhSteveGiveMeRandomness(const Napi::CallbackInfo& info) {
  // get steve to divulge magical temporal randomness from the brain of your device
  uint32_t OutLen = info[0].As<Napi::Number>().Int32Value();
  auto B = Napi::Buffer<unsigned char>::New(info.Env(), OutLen);
  bh_hitbooks(steve, B.Data(), OutLen);
  return B;
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  // prod Steve
  steve = bh_create();
  bh_config(steve)->Channel = 1;

  exports.Set(Napi::String::New(env, "ohSteveOhSteveGiveMeRandomness"),
              Napi::Function::New(env, ohSteveOhSteveGiveMeRandomness));

  return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init)