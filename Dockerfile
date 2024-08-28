FROM node:latest

# Create app directory
WORKDIR /src/app

COPY package*.json ./

RUN npm install
COPY . . 
EXPOSE 5000

RUN npx prisma generate
CMD [ "npm", "run", "dev" ]