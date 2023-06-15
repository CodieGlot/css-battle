FROM ubuntu:22.04
RUN apt-get update
RUN apt-get install curl openjdk-8-jdk build-essential chromium-browser -y
RUN curl -LO https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN apt-get install -y ./google-chrome-stable_current_amd64.deb
RUN rm google-chrome-stable_current_amd64.deb
RUN curl -fsSL https://deb.nodesource.com/setup_18.x -o nodesource_setup.sh
RUN bash nodesource_setup.sh
RUN apt-get install nodejs -y
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install -f

# Bundle app source
COPY . .
RUN npm run build:prod

# Start the server using the production build
CMD [ "node", "dist/main.js" ]
