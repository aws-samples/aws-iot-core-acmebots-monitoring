#!/bin/sh

# Ensure Variables are set
if [ -z $REGION ]; then echo "REGION is not set"; exit 1; fi
if [ -z $SERVICE ]; then echo "SERVICE is not set"; exit 1; fi
if [ -z $STAGE ]; then echo "STAGE is not set"; exit 1; fi
if [ -z $THING_NAME ]; then echo "THING_NAME is not set"; exit 1; fi

# Create config file 
node scripts/env-setup.js

# Run the thing  
node example/Main.js $THING_NAME
