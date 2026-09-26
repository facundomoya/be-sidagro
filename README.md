# NestJS Template Backend

NestJS Template Backend is a server-side application built with NestJS, TypeORM, and MySQL. It provides a clean example of a modular backend architecture with authentication, role-based authorization, audit logging, pagination, file services, and reusable infrastructure for growing APIs.

No frontend is included.

## Main Features

### API Development

- RESTful endpoints organized by module
- Global validation, error handling, and response formatting
- Consistent HTTP status handling
- CORS enabled by default

### Authentication and Authorization

- JWT-based authentication
- Permission-based access control
- Role-aware guards and decorators
- Secure password handling with bcrypt

### Database Layer

- TypeORM integration with MySQL
- Entity-based domain modeling
- Migration support
- Environment-specific database configuration

### Platform Services

- Audit log tracking
- Pagination helper service
- Local filesystem and SFTP file services
- Centralized logging with Winston

## Technologies Used

- Node.js
- NestJS
- TypeORM
- MySQL
- JWT
- Passport
- bcrypt
- class-validator and class-transformer
- Winston

## Project Structure

```text
nestjs-template/
├── src/
│   ├── auth/              # Login, guards, decorators, JWT strategy
│   ├── audit/             # Audit log module, controller, service, interceptor
│   ├── common/            # Shared controllers, services, filters, utilities
│   ├── config/            # Environment validation and config helpers
│   ├── file/              # File system and SFTP service abstractions
│   ├── logger/            # Application logger module and service
│   ├── pagination/        # Pagination utilities and DTOs
│   ├── migrations/        # Database migrations
│   ├── role/              # Role and permission management
└── README.md              # Project documentation
```

## API Endpoints

### Health

- `GET /` - Basic application response

### Auth

- `POST /auth/login` - Authenticate a user and return a token

### Users

- `POST /user/register` - Create a user
- `GET /user` - Get all users
- `GET /user/:id` - Get a user by ID
- `PATCH /user/:id` - Update a user
- `DELETE /user/:id` - Delete a user

### Roles

- `POST /role/create` - Create a role
- `GET /role` - Get all roles
- `GET /role/:id` - Get a role by ID
- `PATCH /role/:id` - Update a role
- `DELETE /role/:id` - Delete a role

### Audit

- `GET /audit/list` - Get the audit log list

## Getting Started

### Prerequisites

- Node.js
- MySQL database
- npm

### Install Dependencies

```bash
npm install
```

### Environment Configuration

Create an environment file based on the selected mode:

- `.env.local`
- `.env.development`
- `.env.test`
- `.env.production`

Required variables:

```env
NODE_ENV=local || development || test || production
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=your_user
DB_PASS=your_password
DB_DATABASE=your_database
DB_DIALECT=mysql

JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=3600s

SFTP_HOST=
SFTP_PORT=
SFTP_USER=
SFTP_PASS=
SFTP_BASE_PATH=
```

The application loads the file that matches `NODE_ENV`. 
For example, `NODE_ENV=local` uses `.env.local`, `NODE_ENV=development` uses `.env.development`

### Run the Application

Other available scripts:

```bash
npm run start:local
npm run start:dev
npm run start:test
npm run start:production
```

## Database Migrations

```bash
npm run migration:generate
npm run migration:create
npm run migration:run
npm run migration:revert
```

Environment-specific migration commands are also available:

```bash
npm run migration:run:local
npm run migration:run:dev
npm run migration:run:test
npm run migration:run:production
```

## Notes

- The app uses a global validation pipe with `whitelist` and type transformation enabled.
- Responses are formatted through a global interceptor.
- Errors are handled by a global HTTP exception filter.
- Audit logging is wired as a global interceptor.

## Development Team

This project was developed by Facundo Moya, student of Information Systems Engineering at the Universidad Tecnológica Nacional - Facultad Regional Tucumán (UTN-FRT).

## Project Status

In progress 🚧
