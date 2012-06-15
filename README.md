Audio-ShaderToy is a GLSL shaders editor that allows you to use audio data (via SoundCloud) to create audio-reactive visuals.

## Get the code

### Clone this repository

OR

### Download Zip file
In terminal run the following commands in this directory to create the Git repository

    git init
    git add .
    git commit -am "init commit"

### .gitignore
Create **.gitignore** file. Place the following text into the file and save.

    node_modules
    .env

---------------

## Initialize and Update the Git Modules
[Embr](https://github.com/notlion/embr), a minimal toolkit and WebGL, is included in the source as a submodule. Initialize ember with the following commands:

    git submodule init
    git submodule update

---------------

## Install Node Module Dependencies
Install all the Node dependencies listed in package.json run the following command in Terminal

    npm install

---------------

## How to use Sass with Burboun for dynamic CSS editing
From the project root, run:

    sass --watch ./sass:static/css -r ./sass/bourbon/lib/bourbon.rb

