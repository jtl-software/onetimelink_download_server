#!/bin/sh

cd /application/source
yarn
yarn build:dev:watch &
yarn server:start