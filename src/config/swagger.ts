import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_PATH = 'docs';

/**
 * Documentacion OpenAPI en /docs (JSON en /docs-json).
 * Los endpoints aparecen solos; los campos de cada DTO se documentan con
 * @ApiProperty / @ApiPropertyOptional (no se usa el plugin del CLI porque
 * genera rutas absolutas rotas cuando la ruta del proyecto tiene "ñ").
 */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('SID-Agro API')
    .setDescription(
      'Sistema de apoyo a la decision para el cultivo de soja. Las rutas protegidas requieren el token JWT obtenido en POST /auth/login.',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}
