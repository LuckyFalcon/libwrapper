1. Node-gyp configure
2. Node-gyp build
3. Copy libAttract.dll to build/Release on Windows.

Make sure the libAttract.dll is copied to the build/Release folder in root.

For linux build:
Add --arch=x86 to node-gyp for x86 build
Change libAttractFunctions to AttractFunctions in:
	1. controller/controller.js 
	2. services/anuapi/anuapi.js
	3. services/getAttractor/forkedlongcomputation.js



