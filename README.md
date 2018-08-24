# OTL Download Server

## Requirements

* Docker + docker compose
* NodeJS 10 (current) + npm or yarn

## Setup

1. Run `yarn`
2. Enable *ESLint* in PHPStorm (automatic configuration search can be enabled)
3. Create a symlink in *var/* that points to your `OTL-API` *var/data* folder
4. Configure your app for production using the file *config/config.prod.js*
**OR** change the config import in *src/index.js* to *config/config.dev* for local development
4. Run `sudo docker-compose up`

And you're done! You can peek into the running docker container using `sudo docker-compose logs -f` or look into the logfile located
at *var/log/app.log* to view the server output.



