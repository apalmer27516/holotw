#!/bin/bash
#Set environment variable to display a rust backtrace.
export RUST_BACKTRACE=1

./holochain-ubuntu -c ./container-config.toml
