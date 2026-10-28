import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from '../../auth/decorators/auth.decorator';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { ValidPermissions } from '../../auth/enums/valid-permissions';
import { User } from '../../user/entities/user.entity';
import { CreateObservacionDto } from '../dto/create-observacion.dto';
import {
  MonitoreoRespuestaDto,
  ObservacionesRespuestaDto,
  ObservacionRespuestaDto,
} from '../dto/monitoreo-response.dto';
import { MonitoreoService } from '../monitoreo/monitoreo.service';

@ApiTags('Agro - Monitoreo de chinche verde')
@Controller('agro/monitoreo/lotes')
export class MonitoreoController {
  constructor(private readonly monitoreoService: MonitoreoService) {}

  @Get(':loteId')
  @Auth(ValidPermissions.MONITOREO_GET)
  @ApiOperation({
    summary: 'Estado del cultivo y fechas para monitorear',
    description:
      'Calcula con grados dia desde la fecha de siembra del lote (sin IA): GDD, GDDA, etapa estimada, nivel de riesgo, proximos 7 dias calificados, proximo monitoreo sugerido y alertas.',
  })
  @ApiOkResponse({ type: MonitoreoRespuestaDto })
  @ApiBadRequestResponse({
    description: 'El lote no tiene fecha de siembra o todavia no fue sembrado',
  })
  @ApiNotFoundResponse({ description: 'El lote no existe' })
  @ApiServiceUnavailableResponse({ description: 'Open-Meteo no respondio' })
  estado(@Param('loteId', ParseIntPipe) loteId: number) {
    return this.monitoreoService.estado(loteId);
  }

  @Get(':loteId/observaciones')
  @Auth(ValidPermissions.MONITOREO_GET)
  @ApiOperation({ summary: 'Historial de observaciones de campo del lote' })
  @ApiOkResponse({ type: ObservacionesRespuestaDto })
  @ApiNotFoundResponse({ description: 'El lote no existe' })
  findObservaciones(@Param('loteId', ParseIntPipe) loteId: number) {
    return this.monitoreoService.findObservaciones(loteId);
  }

  @Post(':loteId/observaciones')
  @Auth(ValidPermissions.MONITOREO_POST)
  @ApiOperation({
    summary: 'Guarda una observacion de campo (presente/ausente y densidad)',
  })
  @ApiCreatedResponse({ type: ObservacionRespuestaDto })
  @ApiBadRequestResponse({
    description:
      'Fecha futura o anterior a la siembra, o presencia sin densidad',
  })
  @ApiNotFoundResponse({ description: 'El lote no existe' })
  createObservacion(
    @Param('loteId', ParseIntPipe) loteId: number,
    @Body() dto: CreateObservacionDto,
    @GetUser() user: User,
  ) {
    return this.monitoreoService.createObservacion(loteId, dto, user);
  }
}
