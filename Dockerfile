FROM ubuntu:22.04
RUN apt-get update
RUN apt-get install curl openjdk-8-jdk build-essential chromium-browser -y
RUN curl -fsSL https://deb.nodesource.com/setup_18.x -o nodesource_setup.sh
RUN bash nodesource_setup.sh
RUN apt-get install nodejs -y
WORKDIR /usr/src/app
COPY . .
RUN npm install -f
RUN npm run build
CMD ["npm", "run", "start:prod"]
