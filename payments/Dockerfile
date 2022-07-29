FROM node:alpine3.13 AS prod
ENV NODE_ENV 'production'
WORKDIR /app
COPY package.json .
RUN npm install --only=prod
COPY . .
CMD ["npm", "start"]


FROM node:alpine3.13 AS dev
ENV NODE_ENV 'development'
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
CMD ["npm", "run", "start:dev"]