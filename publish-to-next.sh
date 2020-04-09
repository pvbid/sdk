#!/bin/bash

git checkout next
git pull
git merge $1
npm version prerelease -m "update to %s"
npm publish --tag next