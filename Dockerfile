FROM node:24.11

WORKDIR /node_mongodb_app

COPY package.json .

RUN npm install

COPY . .

EXPOSE 8000

CMD [ "npm", "start" ]
