{
    "targets": [{
        "target_name": "libAttractFunctions",
        "cflags!": [ "-fno-exceptions" ],
        "cflags_cc!": [ "-fno-exceptions" ],
        "sources": [
            "services/functionwrapper/libAttractFunctions.cc"
        ],
        'include_dirs': [
            "<!@(node -p \"require('node-addon-api').include\")",
            "<!(node -e \"require('nan').include\")"
        ],
        'libraries': [
            "<(module_root_dir)/services/functionwrapper/cppsrc/libAttract/libAttract.a.0.96.1",
            "<(module_root_dir)/services/functionwrapper/cppsrc/libAttract/libAttract.so.0.96.1"
        ],
        'dependencies': [
            "<!(node -p \"require('node-addon-api').gyp\")"
        ],
        'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ]
    },
    {
        "target_name": "libTemporalFunctions",
        "cflags!": [ "-fno-exceptions" ],
        "cflags_cc!": [ "-fno-exceptions" ],
        "sources": [
            "services/functionwrapper/libTemporalFunctions.cc"
        ],
        'include_dirs': [
            "<!@(node -p \"require('node-addon-api').include\")",
            "<!(node -e \"require('nan').include\")"
        ],
        'libraries': [
            "<(module_root_dir)/services/functionwrapper/cppsrc/libTemporal/libTemporal.a",
            "<(module_root_dir)/services/functionwrapper/cppsrc/libTemporal/libgenerators.a"
        ],
        'dependencies': [
            "<!(node -p \"require('node-addon-api').gyp\")"
        ],
        'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ]
    }]
}
