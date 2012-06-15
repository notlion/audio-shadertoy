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

To deploy to Heroku and use the Heroku Add-on services we need to have an App created. Follow the instructions here http://devcenter.heroku.com/articles/node-js

*   Install Heroku toolbelt if you do not already have it installed
*   Create a new App on Heroku with the following command

    heroku create --stack cedar

This creates a new App on Heroku and adds a remote path to your Git repository.

---------------


## Add and configure MongoLabs

### Add the MongoLabs add-ons
To add MongoLabs as your MongoDB provider run the following command in terminal. This will add the free starter plan MongoLabs offers to Heroku users. Be sure you have verified your Heroku account http://www.heroku.com/verify

    heroku addons:add mongolab:starter

Next, we need to get the username, password and database URI that MongoLabs has supplied us. Heroku keeps this in the a configuration file. Run the following,

    heroku config | grep MONGOLAB_URI

This will return your MongoLabs connection string

    MONGOLAB_URI => mongodb://username:password@host:port/database

### Create environment configuration file
We need to create a new file name **.env** this will hold the MongoLabs information. This will allow you to use the Environment variables in your code, this is good for keeping your username and password out of your code.

Copy the string from the previous Terminal command, copy all text after **=>** . It should look similar to this,

    mongodb://username:password@host:port/database

In your **.env** file, create a variable for **MONGOLAB_URI=** append it with the string you copied

    MONGOLAB_URI=mongodb://username:password@host:port/database

Save the file.

You can access environment variables in your NodeJS code via process.env.MONGOLAB_URI

---------------

## How to use Sass with Burboun for dynamic CSS editing
From the project root, run:

    sass --watch ./sass:static/css -r ./sass/bourbon/lib/bourbon.rb

---------------

## How to test the app locally
Use foreman to debug locally

    foreman start

