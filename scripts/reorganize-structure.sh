#!/bin/bash

# Move all files from therapy-hub-admin-main to root
if [ -d "therapy-hub-admin-main" ]; then
    echo "Moving files from therapy-hub-admin-main to root..."
    
    # Copy all files/folders from therapy-hub-admin-main to root (except itself)
    cp -r therapy-hub-admin-main/* .
    cp -r therapy-hub-admin-main/.* . 2>/dev/null || true
    
    # Remove the old folder
    rm -rf therapy-hub-admin-main
    
    echo "Structure reorganization complete!"
else
    echo "therapy-hub-admin-main folder not found"
fi
