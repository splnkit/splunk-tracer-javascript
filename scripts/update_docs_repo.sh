#!/usr/bin/env bash

#-------------------------------------------------------------------------------
# Copies the compiled assets to splunk.github.io so the assets are easily,
# publicly accessible from a standard location.
#-------------------------------------------------------------------------------
set -e

#
# Clone the docs repo
#
rm -rf temp
mkdir -p temp
pushd temp
git clone git@github.com:splunk/splunk.github.io
popd
BASEDIR=temp/splunk.github.io/dist

#
# Copy the latest splunk artifacts
#
VERSION=`node -e "p=require('./package.json'); console.log(p.version)"`
OUTDIR=$BASEDIR/splunk-tracer-javascript/$VERSION
mkdir -p $OUTDIR && cp dist/* $OUTDIR
OUTDIR=$BASEDIR/splunk-tracer-javascript/current
mkdir -p $OUTDIR && cp dist/* $OUTDIR

#
# Copy the latest OpenTracing artifacts
#
pushd node_modules/opentracing
VERSION=`node -e "p=require('./package.json'); console.log(p.version)"`
popd
OUTDIR=$BASEDIR/opentracing-javascript/$VERSION
mkdir -p $OUTDIR && cp -R node_modules/opentracing/dist/* $OUTDIR
OUTDIR=$BASEDIR/opentracing-javascript/current
mkdir -p $OUTDIR && cp -R node_modules/opentracing/dist/* $OUTDIR

#
# Publish the files via a git push
#
pushd temp/splunk.github.io
git add .
git commit -m "Update dist files"
git push
popd

rm -rf temp
