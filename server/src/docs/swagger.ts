import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Solana Session Key API',
      version: '1.0.0',
      description: 'Solana 세션 키 관리를 위한 API 서비스',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '개발 서버'
      },
      {
        url: 'https://api.example.com',
        description: '운영 서버'
      }
    ],
    components: {
      schemas: {
        SessionKey: {
          type: 'object',
          properties: {
            sessionPublicKey: {
              type: 'string',
              description: '세션 공개 키'
            },
            userMainPublicKey: {
              type: 'string',
              description: '사용자 메인 지갑 공개 키'
            },
            expiresAt: {
              type: 'number',
              description: '만료 시간 (UNIX 타임스탬프)'
            },
            isRevoked: {
              type: 'boolean',
              description: '취소 여부'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: '에러 메시지'
            }
          }
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/controllers/*.ts', './src/routes/*.ts'] // Include both controllers and routes
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi }; 