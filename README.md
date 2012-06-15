Audio-ShaderToy is a GLSL shaders editor that allows you to use audio data (via SoundCloud) to create audio-reactive visuals.

---------------

## Setup

Clone this repository or Download the Zip file

#### Create **.gitignore** file. Place the following text into the file and save.

    node_modules
    .env

#### Update the .env file with a MONGODB_URI variable.

    echo "MONGODB_URI=mongodb://<user>:<pass>@<host>:<db>" >> .env

#### Initialize and Update the Git Modules
[Embr](https://github.com/notlion/embr), a minimal toolkit and WebGL, is included in the source as a submodule. Initialize ember with the following commands:

    git submodule init
    git submodule update

#### Install Node Module Dependencies
Install all the Node dependencies listed in package.json run the following command in Terminal

    npm install

---------------

## Local Testing

#### Get sass running to update the css

    sass --watch ./sass:static/css -r ./sass/bourbon/lib/bourbon.rb

#### Use foreman to test the app locally

    foreman start
