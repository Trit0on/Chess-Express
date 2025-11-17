import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Chess RPG API',
      version: '1.0.0',
      description: 'API documentation for the Chess RPG application',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./api/*.js', './api/dto/*.js'],
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };