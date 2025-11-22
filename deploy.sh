#!/bin/bash

# Deployment script for Options Trading Simulator
# This script builds the application and deploys it to homelab server

set -e  # Exit immediately if a command exits with a non-zero status

# Configuration
REMOTE_HOST="homelab"
REMOTE_PATH="/DATA/AppData/nginx/config/www/"
LOCAL_DIST_PATH="./dist"

echo "Starting deployment process..."

# Step 1: Build the application
echo "Building the application..."
npm run build

# Step 2: Check if build was successful
if [ ! -d "$LOCAL_DIST_PATH" ]; then
    echo "Error: Build directory does not exist. Build may have failed."
    exit 1
fi

echo "Build completed successfully."

# Step 3: Clean the remote directory
echo "Cleaning remote directory..."
ssh "$REMOTE_HOST" "rm -rf $REMOTE_PATH*"

# Step 4: Create remote directory if it doesn't exist
ssh "$REMOTE_HOST" "mkdir -p $REMOTE_PATH"

# Step 5: Copy the built files to the remote server using scp
echo "Deploying files to $REMOTE_HOST:$REMOTE_PATH..."
scp -r "$LOCAL_DIST_PATH"/* "$REMOTE_HOST:$REMOTE_PATH"

echo "Deployment completed successfully!"
echo "Application deployed to: $REMOTE_HOST:$REMOTE_PATH"
