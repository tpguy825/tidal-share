#!/bin/bash
bun tailwindcss -i main.css -o twout.css 
bunx postcss-cli twout.css -o assets/styles.css 
rm twout.css