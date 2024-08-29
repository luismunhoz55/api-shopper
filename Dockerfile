FROM node:latest

# Create app directory
WORKDIR /src/app

COPY package*.json ./

RUN npm install
COPY . . 
EXPOSE 5000

RUN npx prisma generate 
RUN npx prisma migrate dev --name init
CMD [ "npm", "run", "dev" ]