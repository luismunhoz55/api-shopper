import fastify from "fastify";

const server = fastify();

server.get("/healthcheck", (req, rep) => {
  return {
    status: "OK",
  };
});

// Configure fastify
server
  .listen({
    port: 3333,
  })
  .then(() => {
    console.log("Server rodando em localhost:3333");
  });
