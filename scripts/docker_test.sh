#!/usr/bin/env bash

docker run -t --rm --name test-runner-splunk-tracer \
    -v ${PWD}:/usr/src/splunk-tracer -w /usr/src/splunk-tracer \
    node:$1 npm test
