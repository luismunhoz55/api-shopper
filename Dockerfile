FROM node:latest

WORKDIR /src

COPY . .

RUN npm install

CMD ["npm", "run", "dev"]

EXPOSE 3000