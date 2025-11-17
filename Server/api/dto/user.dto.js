/**
 * @swagger
 * components:
 *   schemas:
 *     UserDto:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: User ID
 *         email:
 *           type: string
 *           format: email
 *           description: User email
 *         name:
 *           type: string
 *           description: User name
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation date
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update date
 *     UserResponseDto:
 *       type: object
 *       properties:
 *         ok:
 *           type: boolean
 *           description: Response status
 *         user:
 *           $ref: '#/components/schemas/UserDto'
 *     UsersResponseDto:
 *       type: object
 *       properties:
 *         ok:
 *           type: boolean
 *           description: Response status
 *         users:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserDto'
 *     ErrorResponseDto:
 *       type: object
 *       properties:
 *         ok:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           description: Error message
 */

export class UserDto {
  constructor(user) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}

export class UserResponseDto {
  constructor(user) {
    this.ok = true;
    this.user = new UserDto(user);
  }
}

export class UsersResponseDto {
  constructor(users) {
    this.ok = true;
    this.users = users.map(user => new UserDto(user));
  }
}

export class ErrorResponseDto {
  constructor(message) {
    this.ok = false;
    this.message = message;
  }
}
