/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequestDto:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *           description: User email
 *         password:
 *           type: string
 *           format: password
 *           example: "password123"
 *           description: User password
 *     SignupRequestDto:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *           description: User email
 *         password:
 *           type: string
 *           format: password
 *           example: "password123"
 *           description: User password
 *         name:
 *           type: string
 *           example: "John Doe"
 *           description: User name (optional)
 *     AuthResponseDto:
 *       type: object
 *       properties:
 *         ok:
 *           type: boolean
 *           example: true
 *           description: Response status
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               example: "clx123abc"
 *             email:
 *               type: string
 *               example: "user@example.com"
 *             name:
 *               type: string
 *               example: "John Doe"
 *         accessToken:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *           description: JWT access token
 *     RefreshResponseDto:
 *       type: object
 *       properties:
 *         ok:
 *           type: boolean
 *           example: true
 *           description: Response status
 *         accessToken:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *           description: New JWT access token
 */

export class AuthResponseDto {
  constructor(user, accessToken) {
    this.ok = true;
    this.user = {
      id: user.id,
      email: user.email,
      name: user.name
    };
    this.accessToken = accessToken;
  }
}

export class RefreshResponseDto {
  constructor(accessToken) {
    this.ok = true;
    this.accessToken = accessToken;
  }
}

export class ErrorResponseDto {
  constructor(message) {
    this.ok = false;
    this.message = message;
  }
}
