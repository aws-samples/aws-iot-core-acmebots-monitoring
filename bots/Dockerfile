# Create image based on the official Node 8 image from docker hub
FROM node:8

# Create a directory where our app will be placed
RUN mkdir -p /usr/src/app

# Change directory so that our commands run inside this new directory
WORKDIR /usr/src/app

# Copy source code
COPY . /usr/src/app

# Install dependecies
RUN npm install

# Run Setup / Config
# RUN node scripts/setup.js

# Make run_thing.sh executable
RUN chmod 755 run_thing.sh

# Expose the MQTT port 
EXPOSE 8883

# Run the bot (name passed from environment variable $THING_NAME)
#CMD ["node", "example/Main.js", "$THING_NAME"]
CMD ["./run_thing.sh"]
