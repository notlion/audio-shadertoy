Audio-ShaderToy is a GLSL editor that includes audio spectrum data for creating audio-reactive shaders.

Currently running at [audioshader.net](www.audioshader.net).

By [@notlion](https://github.com/notlion) [@quilime](https://github.com/quilime) [@rezaali](https://github.com/rezaali)

---------------

## Setup

Clone this repository or Download the Zip file

#### Create **.gitignore** file. Place the following text into the file and save.

    node_modules
    .env

#### Update the .env file with a MONGODB_URI variable.

    echo "MONGODB_URI=mongodb://<user>:<pass>@<host>:<db>" >> .env

#### Initialize and Update the Git Modules
[Embr](https://github.com/notlion/embr), a minimal WebGL toolkit, is included in the source as a git submodule.
Initialize embr with the following commands:

    git submodule init
    git submodule update

#### Install Node Module Dependencies
Install all the Node dependencies listed in package.json run the following command in Terminal

    npm install

## Local Testing

#### Get sass running to update the css

    sass --watch ./sass:static/css -r ./sass/bourbon/lib/bourbon.rb

#### Use foreman to test the app locally

    foreman start
