# FROM ubuntu:22.04
# RUN apt-get update
# RUN apt-get install curl openjdk-8-jdk build-essential chromium-browser -y
# RUN curl -LO https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
# RUN apt-get install -y ./google-chrome-stable_current_amd64.deb
# RUN rm google-chrome-stable_current_amd64.deb
# RUN curl -fsSL https://deb.nodesource.com/setup_18.x -o nodesource_setup.sh
# RUN bash nodesource_setup.sh
# RUN apt-get install nodejs -y
# WORKDIR /usr/src/app

# # A wildcard is used to ensure both package.json AND package-lock.json are copied
# COPY package*.json ./

# # Install app dependencies
# RUN npm install -f

# # Bundle app source
# COPY . .
# RUN npm run build:prod

# # Start the server using the production build
# CMD [ "node", "dist/main.js" ]


FROM node:16.19.0

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Create app directory
WORKDIR /app

RUN apt-get update && apt-get install gnupg wget -y && \
    wget --quiet --output-document=- https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-archive.gpg && \
    sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
    apt-get update && \
    apt-get install google-chrome-stable -y --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

COPY . /app

RUN npm install

RUN npm run build:prod

EXPOSE 4000

CMD [ "npm", "run", "start" ]

# how to run
# step 1
# docker build  -t css-battle .
# step 2
# docker run -d -p 4000:4000 --env-file .env css-battle

