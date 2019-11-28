// Functions.cpp
#include <node.h>
#include <nan.h>

//C headers for the lib
#include "cppsrc/export_h.h"
#include "cppsrc/test_coords.h"
#include <vector>

//For buffer
#include <iostream>
#include <sstream>
#include <vector>

using namespace v8;

unsigned char hex2int(const char input)
{
  if (input >= '0' && input <= '9')
    return input - '0';
  if (input >= 'A' && input <= 'F')
    return input - 'A' + 10;
  if (input >= 'a' && input <= 'f')
    return input - 'a' + 10;
  return 0;
}

char* getFromANU( const uint32_t hexSize)
{
  // Simulated QRNG poll example, real ANU rng output loaded from file
  char* myHexString = (char*)malloc(hexSize); // This has been changed. In C++, you need to cast the return of malloc()
  if (myHexString == NULL)
    return NULL;
  FILE* testFile = fopen(TEST_HEX_NAME, "r");
  if (testFile != NULL) {
    fread((void*)myHexString, sizeof(char), hexSize, testFile);
    fclose(testFile);
  }
  return myHexString;
};

unsigned char* getFromBinary(const unsigned long bytesSize ) {
  
  unsigned char* myByteString = (unsigned char*)malloc(bytesSize);
  char* myHexString = getFromANU(bytesSize*2);
  if (myByteString == NULL || myHexString == NULL)
    return NULL;
  unsigned long cnt = 0;
  for (unsigned long i = 0; i < bytesSize; i++)
  {
    myByteString[i] = hex2int(myHexString[cnt]) * 16 + hex2int(myHexString[cnt + 1]);
    cnt += 2;
  }
  free(myHexString);//deallocate  
  return myByteString;
}


//get library version, just returns values from the corresponding header (for C# compatibility etc)
void getVersionMajor(const FunctionCallbackInfo<Value>& args) {
 
  uint32_t a = getVersionMajor(); 
  
  args.GetReturnValue().Set(a);
}

void getVersionMinor(const FunctionCallbackInfo<Value>& args) {
 
  
  uint32_t b = getVersionMinor();
 
  args.GetReturnValue().Set(b);
}

void getVersionPatch(const FunctionCallbackInfo<Value>& args) {
 
  uint32_t c = getVersionPatch();

  args.GetReturnValue().Set(c);
}

//how many coordinates is needed for requested radius, optimized for performance on larger areas
void getOptimizedDots(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  // Check the number of arguments passed.
  if (args.Length() != 1) {
    // Throw an Error that is passed back to JavaScript
    isolate->ThrowException(Exception::TypeError(
        String::NewFromUtf8(isolate,
                            "Wrong number of arguments",
                            NewStringType::kNormal).ToLocalChecked()));
    return;
  }

  // Check the argument types
  if (!args[0]->IsNumber()) {
    isolate->ThrowException(Exception::TypeError(
        String::NewFromUtf8(isolate,
                            "Wrong arguments",
                            NewStringType::kNormal).ToLocalChecked()));
    return;
  }

  // set double to argument passed
  const double radius = 
      args[0].As<Number>()->Value();
  
  //Run function
  uint32_t No = getOptimizedDots(radius); //quadratic dependence on radius

  args.GetReturnValue().Set(No);
}

//how many dots are needed for the chosen spot size
void getDotsBySpotRadius(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  // Check the number of arguments passed.
  if (args.Length() < 2) {
    // Throw an Error that is passed back to JavaScript
    isolate->ThrowException(Exception::TypeError(
        String::NewFromUtf8(isolate,
                            "Wrong number of arguments",
                            NewStringType::kNormal).ToLocalChecked()));
    return;
  }

  // Check the argument types
  if (!args[0]->IsNumber()) {
    isolate->ThrowException(Exception::TypeError(
        String::NewFromUtf8(isolate,
                            "Wrong arguments",
                            NewStringType::kNormal).ToLocalChecked()));
    return;
  }
  
  // set double to argument passed
  const double spotRadius = 
      args[0].As<Number>()->Value();

  const double radius = 
     args[1].As<Number>()->Value();
  
  //Run function
  uint32_t N = getDotsBySpotRadius(spotRadius, radius);

  //Return N
  args.GetReturnValue().Set(N);

}

//reverse problem: what is the expected minimum attractor radius given number of dots and area
void getSpotSize(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  // Check the number of arguments passed.
  if (args.Length() < 2) {
    // Throw an Error that is passed back to JavaScript
    isolate->ThrowException(Exception::TypeError(
        String::NewFromUtf8(isolate,
                            "Wrong number of arguments",
                            NewStringType::kNormal).ToLocalChecked()));
    return;
  }

  // Check the argument types
  if (!args[0]->IsNumber()) {
    isolate->ThrowException(Exception::TypeError(
        String::NewFromUtf8(isolate,
                            "Wrong arguments",
                            NewStringType::kNormal).ToLocalChecked()));
    return;
  }
  
  // set double to argument passed
  const double No = 
      args[0].As<Number>()->Value();

  const double radius = 
     args[1].As<Number>()->Value();
  
  //Run function
  double spotRadiusOpt = getSpotSize(No, radius);

  //Return spotRadiusOpt
  args.GetReturnValue().Set(spotRadiusOpt);

}


//Works with TEST_HEX_RADIUS Need to add another function that checks for arguments. So arguments too can be passed.
void requiredEnthropyBytes(const FunctionCallbackInfo<Value>& args) {
 Isolate* isolate = args.GetIsolate();
 
 if (args.Length() < 1) {
    unsigned long th = getOptimizedDots(TEST_HEX_RADIUS); //radius for entropy.hex
 	uint32_t bytesSize = requiredEnthropyBytes(th);
 	args.GetReturnValue().Set(bytesSize);
    return;
  }


  unsigned long th = getOptimizedDots(TEST_HEX_RADIUS); //radius for entropy.hex
  uint32_t bytesSize = requiredEnthropyBytes(th);

  //Return bytesSize
  args.GetReturnValue().Set(bytesSize);

}

//Works with TEST_HEX_RADIUS Need to add another function that checks for arguments. So arguments too can be passed.
void requiredEnthropyHex(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
 
  uint32_t th = args[0].As<Number>()->Value();

  uint32_t hexSize = requiredEnthropyHex(th);

  args.GetReturnValue().Set(hexSize);

}


void getHandle(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
 	
  uint32_t handle = getHandle();

  //Return handle
  args.GetReturnValue().Set(handle);

}

void findAttractors(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  
  const double filtering_treshold = FILTERING_SIGNIFICANCE - 0.5;

  uint32_t instance = 
      args[0].As<Number>()->Value();

  uint32_t findResult = 
    findAttractors(instance, 
      SIGNIFICANCE, //lower custom significance affects performance, handle with care
      filtering_treshold //only affects number of output results and memory consumption, low performance impact
    );

  //Return result of findAttractors()
  args.GetReturnValue().Set(findResult);

}

void getAttractorsLength(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  
  const double filtering_treshold = FILTERING_SIGNIFICANCE - 0.5;

  uint32_t instance = 
      args[0].As<Number>()->Value();

  uint32_t findResult = getAttractorsLength(instance);

  //Return result of findAttractors()
  args.GetReturnValue().Set(findResult);

}

void getAttractors(const FunctionCallbackInfo<Value>& args) {
 
  Isolate* isolate = args.GetIsolate();

  uint32_t instance = 
      args[0].As<Number>()->Value();
  uint32_t radius = 
      args[1].As<Number>()->Value();
  double x = 
       args[2].As<Number>()->Value();
  double y = 
       args[3].As<Number>()->Value();
  uint32_t attl = 
       args[4].As<Number>()->Value();
  uint32_t GID = 
       args[5].As<Number>()->Value();

  const LatLng center = { x , y };

  struct FinalAttractor* atts = getAttractors(instance, radius, center, GID);
         
  Local<Array> result_list = Array::New(isolate);
  for (unsigned int i = 0; i < attl; i++ ) {
      Local<Object> result = Object::New(isolate);
      result->Set(String::NewFromUtf8(isolate, "GID"), Number::New(isolate, atts[i].GID));
      result->Set(String::NewFromUtf8(isolate, "TID"), Number::New(isolate, atts[i].TID));
      result->Set(String::NewFromUtf8(isolate, "LID"), Number::New(isolate, atts[i].LID));
      result->Set(String::NewFromUtf8(isolate, "type"), Number::New(isolate, atts[i].type));
      result->Set(String::NewFromUtf8(isolate, "x"), Number::New(isolate, atts[i].x));
      result->Set(String::NewFromUtf8(isolate, "y"), Number::New(isolate, atts[i].y));
      
      result->Set(String::NewFromUtf8(isolate, "latitude"), Number::New(isolate, atts[i].center.point.latitude));
      result->Set(String::NewFromUtf8(isolate, "longitude"), Number::New(isolate, atts[i].center.point.longitude));

      result->Set(String::NewFromUtf8(isolate, "distance"), Number::New(isolate, atts[i].center.bearing.distance));
      result->Set(String::NewFromUtf8(isolate, "initialBearing"), Number::New(isolate, atts[i].center.bearing.initialBearing));
      result->Set(String::NewFromUtf8(isolate, "finalBearing"), Number::New(isolate, atts[i].center.bearing.finalBearing));

      result->Set(String::NewFromUtf8(isolate, "side"), Number::New(isolate, atts[i].side));
      result->Set(String::NewFromUtf8(isolate, "distanceErr"), Number::New(isolate, atts[i].distanceErr));
      result->Set(String::NewFromUtf8(isolate, "radiusM"), Number::New(isolate, atts[i].radiusM));
      result->Set(String::NewFromUtf8(isolate, "n"), Number::New(isolate, atts[i].n));
      result->Set(String::NewFromUtf8(isolate, "mean"), Number::New(isolate, atts[i].mean));

      result->Set(String::NewFromUtf8(isolate, "rarity"), Number::New(isolate, atts->rarity));

      result->Set(String::NewFromUtf8(isolate, "power_old"), Number::New(isolate, atts[i].power_old));
      result->Set(String::NewFromUtf8(isolate, "power"), Number::New(isolate, atts[i].power));
      result->Set(String::NewFromUtf8(isolate, "z_score"), Number::New(isolate, atts[i].z_score));
      result->Set(String::NewFromUtf8(isolate, "probability_single"), Number::New(isolate, atts[i].probability_single));
      result->Set(String::NewFromUtf8(isolate, "integral_score"), Number::New(isolate, atts[i].integral_score));
      result->Set(String::NewFromUtf8(isolate, "significance"), Number::New(isolate, atts[i].significance));
      result->Set(String::NewFromUtf8(isolate, "probability"), Number::New(isolate, atts[i].probability));

      result_list->Set(i, result);
  }


     args.GetReturnValue().Set(result_list);
}



void initWithPseudo(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  unsigned int seed; 
  if (args.Length() < 2) {
    // Throw an Error that is passed back to JavaScript
    isolate->ThrowException(Exception::TypeError(
        String::NewFromUtf8(isolate,
                            "Wrong number of arguments",
                            NewStringType::kNormal).ToLocalChecked()));
    return;
  }

  if (args.Length() > 2){
    unsigned int tmp = 
     args[2].As<Number>()->Value();
     seed = tmp;
    

  } else {

    unsigned int seed = (unsigned int)RANDOM_SEED;

  }

  // Check the argument types
  if (!args[0]->IsNumber()) {
    isolate->ThrowException(Exception::TypeError(
        String::NewFromUtf8(isolate,
                            "Wrong arguments",
                            NewStringType::kNormal).ToLocalChecked()));
    return;
  }
  
  // set double to argument passed
  uint32_t handle = 
      args[0].As<Number>()->Value();

  uint32_t N = 
     args[1].As<Number>()->Value();

  uint32_t instance = initWithPseudo(handle, N, seed);

  //Return handle
  args.GetReturnValue().Set(instance);

}

//Works with TEST_COORDS_SIZE and TEST_COORDS // Currently working on Engine
void initWithCoords(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  
  unsigned long Nc = TEST_COORDS_SIZE / 2; // size for test_coords from test_coords.h, 15000 doubles means 7500 2D coords

  // set double to argument passed
  uint32_t handle = 
      args[0].As<Number>()->Value();

  uint32_t instance = initWithCoords(handle, TEST_COORDS, Nc);   

  args.GetReturnValue().Set(instance);

}

//init with Bytes Not yet working. Need to have getFromBinary
void initWithBytes(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  
  // set double to argument passed
  uint32_t handle = 
      args[0].As<Number>()->Value();

  unsigned long th = getOptimizedDots(TEST_HEX_RADIUS);
  unsigned long bytesSize = requiredEnthropyBytes(th);


  printf("Required bytes from TRNG: %lu\n", bytesSize);

  //Fix this later
  unsigned char* myByteString = getFromBinary(bytesSize); //simulated binary TRNG poll, converts entropy.hex to bytes

  uint32_t instance = initWithBytes(handle, myByteString, bytesSize);
  
  //Return instance
  args.GetReturnValue().Set(instance);

}

//init with Bytes Not yet working. Need to have getFromHex
void initWithHex(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Local<Context> context = isolate->GetCurrentContext();

  uint32_t handle = 
      args[0].As<Number>()->Value();

  //char* myHexString = ToObject(args[1]);
  //char* myHexString = Buffer(args[0]);
  //char* myHexString = node::Buffer::Data(bufferObj);
  char* myHexString = (char*) node::Buffer::Data(args[1]->ToObject(context).ToLocalChecked());

  uint32_t hexSize = 
      args[2].As<Number>()->Value();

  uint32_t instance = initWithHex(handle, myHexString, hexSize);

  args.GetReturnValue().Set(instance);


}

//init with Bytes Not yet working. Need to have getFromHex
void runEngine(const FunctionCallbackInfo<Value>& args) {
 
}

void returnFiltering(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();

  args.GetReturnValue().Set(FILTERING_SIGNIFICANCE);
}

struct Work {
  uv_work_t  request;
  Persistent<Function> callback;

  uint32_t instance; 
  uint32_t radius; 
  double x; 
  double y;
  uint32_t GID;
  uint32_t att1;
  double filter;

  FinalAttractor* atts;

};



static void WorkAsync(uv_work_t *req)
{

  Work *work = static_cast<Work *>(req->data);
  
  // this is the worker thread, lets build up the results
  // allocated results from the heap because we'll need
  // to access in the event loop later to send back

  uint32_t instance = work->instance;
  uint32_t radius = work->radius;
  double x = work->x;
  double y = work->y;
  double filtering_treshold = work->filter;

  uint32_t GID = work->GID;

  findAttractors(instance, 
    SIGNIFICANCE, //lower custom significance affects performance, handle with care
    filtering_treshold //only affects number of output results and memory consumption, low performance impact
  );
 
  uint32_t att1 = getAttractorsLength(instance);

  work->att1 = att1;

  const LatLng center = { x , y };

  struct FinalAttractor* atts = getAttractors(instance, radius, center, GID);

  work->atts = atts;

}

// called by libuv in event loop when async function completes
static void WorkAsyncComplete(uv_work_t *req,int status)
{
  Isolate * isolate = Isolate::GetCurrent();
  v8::HandleScope handleScope(isolate); // Required for Node 4.x
    
  Work *work = static_cast<Work *>(req->data);
 
  uint32_t att1 = work->att1;
  struct FinalAttractor* atts = work->atts;
  double filtering_treshold = work->filter;
  
  Local<Array> result_list = Array::New(isolate);
  for (unsigned int i = 0; i < att1; i++ ) {
      Local<Object> result = Object::New(isolate);
      result->Set(String::NewFromUtf8(isolate, "GID"), Number::New(isolate, atts[i].GID));
      result->Set(String::NewFromUtf8(isolate, "TID"), Number::New(isolate, atts[i].TID));
      result->Set(String::NewFromUtf8(isolate, "LID"), Number::New(isolate, atts[i].LID));
      result->Set(String::NewFromUtf8(isolate, "type"), Number::New(isolate, atts[i].type));
      result->Set(String::NewFromUtf8(isolate, "x"), Number::New(isolate, atts[i].x));
      result->Set(String::NewFromUtf8(isolate, "y"), Number::New(isolate, atts[i].y));
      
      result->Set(String::NewFromUtf8(isolate, "latitude"), Number::New(isolate, atts[i].center.point.latitude));
      result->Set(String::NewFromUtf8(isolate, "longitude"), Number::New(isolate, atts[i].center.point.longitude));

      result->Set(String::NewFromUtf8(isolate, "distance"), Number::New(isolate, atts[i].center.bearing.distance));
      result->Set(String::NewFromUtf8(isolate, "initialBearing"), Number::New(isolate, atts[i].center.bearing.initialBearing));
      result->Set(String::NewFromUtf8(isolate, "finalBearing"), Number::New(isolate, atts[i].center.bearing.finalBearing));

      result->Set(String::NewFromUtf8(isolate, "side"), Number::New(isolate, atts[i].side));
      result->Set(String::NewFromUtf8(isolate, "distanceErr"), Number::New(isolate, atts[i].distanceErr));
      result->Set(String::NewFromUtf8(isolate, "radiusM"), Number::New(isolate, atts[i].radiusM));
      result->Set(String::NewFromUtf8(isolate, "n"), Number::New(isolate, atts[i].n));
      result->Set(String::NewFromUtf8(isolate, "mean"), Number::New(isolate, atts[i].mean));

      result->Set(String::NewFromUtf8(isolate, "rarity"), Number::New(isolate, atts->rarity));

      result->Set(String::NewFromUtf8(isolate, "power_old"), Number::New(isolate, atts[i].power_old));
      result->Set(String::NewFromUtf8(isolate, "power"), Number::New(isolate, atts[i].power));
      result->Set(String::NewFromUtf8(isolate, "z_score"), Number::New(isolate, atts[i].z_score));
      result->Set(String::NewFromUtf8(isolate, "probability_single"), Number::New(isolate, atts[i].probability_single));
      result->Set(String::NewFromUtf8(isolate, "integral_score"), Number::New(isolate, atts[i].integral_score));
      result->Set(String::NewFromUtf8(isolate, "significance"), Number::New(isolate, atts[i].significance));
      result->Set(String::NewFromUtf8(isolate, "probability"), Number::New(isolate, atts[i].probability));
      result->Set(String::NewFromUtf8(isolate, "FILTERING_SIGNIFICANCE"), Number::New(isolate, filtering_treshold));

      result_list->Set(i, result);
  }

    // set up return arguments
    const unsigned argc = 1;
    Local<Context> context = isolate->GetCurrentContext();
    Local<Value> argv[argc] = { result_list };
    
    // execute the callback
    Local<Function>::New(isolate, work->callback)->Call(context, Null(isolate), argc , argv).ToLocalChecked();
    
   // Free up the persistent function callback
    work->callback.Reset();
   
    delete work;
}

void CalculateResultsAsync(const FunctionCallbackInfo<Value>&args) {

  Isolate* isolate = args.GetIsolate();

  Work * work = new Work();
  work->request.data = work;

  uint32_t instance = 
       args[0].As<Number>()->Value();
  uint32_t radius = 
       args[1].As<Number>()->Value();
  double x = 
       args[2].As<Number>()->Value();
  double y = 
       args[3].As<Number>()->Value();
  uint32_t GID = 
       args[4].As<Number>()->Value();
  double filter = 
       args[5].As<Number>()->Value();

   work->instance = instance;
   work->radius = radius;
   work->x = x;
   work->y = y;
   work->GID = GID;
   work->filter = filter;

    // store the callback from JS in the work package so we can 
    // invoke it later
    Local<Function> callback = Local<Function>::Cast(args[6]);
    work->callback.Reset(isolate, callback);

    // kick of the worker thread
    uv_queue_work(uv_default_loop(),&work->request,
        WorkAsync,WorkAsyncComplete);

   args.GetReturnValue().Set(Undefined(isolate)); // THIS HAS TO BE DONE // );

}


void init(Local<Object> exports) {

  NODE_SET_METHOD(exports, "getVersionMajor", getVersionMajor);
  NODE_SET_METHOD(exports, "getVersionMinor", getVersionMinor);
  NODE_SET_METHOD(exports, "getVersionPatch", getVersionPatch);


  NODE_SET_METHOD(exports, "getOptimizedDots", getOptimizedDots);
  NODE_SET_METHOD(exports, "getDotsBySpotRadius", getDotsBySpotRadius);
  NODE_SET_METHOD(exports, "getSpotSize", getSpotSize);

  NODE_SET_METHOD(exports, "requiredEnthropyBytes", requiredEnthropyBytes);
  NODE_SET_METHOD(exports, "requiredEnthropyHex", requiredEnthropyHex);

  NODE_SET_METHOD(exports, "getHandle", getHandle);
  NODE_SET_METHOD(exports, "initWithPseudo", initWithPseudo);

  NODE_SET_METHOD(exports, "initWithCoords", initWithCoords);
  NODE_SET_METHOD(exports, "initWithBytes", initWithBytes); 
  NODE_SET_METHOD(exports, "initWithHex", initWithHex); 
 
  NODE_SET_METHOD(exports, "findAttractors", findAttractors);
  NODE_SET_METHOD(exports, "getAttractorsLength", getAttractorsLength);
  NODE_SET_METHOD(exports, "getAttractors", getAttractors);

  NODE_SET_METHOD(exports, "CalculateResultsAsync", CalculateResultsAsync);

  NODE_SET_METHOD(exports, "returnFiltering", returnFiltering);


}

NODE_MODULE(hello_addon, init)
