import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { QueryDto } from '../../common/dtos/baseQuery.dto';
import { Auth } from '../../auth/decorators/auth.decorator';
import { GetUser } from '../../auth/decorators/get-user.decorator';
import { ValidPermissions } from '../../auth/enums/valid-permissions';
import { User } from '../../user/entities/user.entity';
import { CreateSimulacionDto } from '../dto/create-simulacion.dto';
import {
  SimulacionesRespuestaDto,
  SimulacionRespuestaDto,
} from '../dto/simulacion-response.dto';
import { SimulacionService } from '../services/simulacion.service';

@ApiTags('Agro - Simulaciones')
@Controller('agro/simulaciones')
export class SimulacionController {
  constructor(private readonly simulacionService: SimulacionService) {}

  @Post()
  @Auth(ValidPermissions.SIMULACION_POST)
  @ApiOperation({
    summary: 'Crea el escenario y genera la recomendacion con IA',
    description:
      'Clima MANUAL (datosClimaticos) o API (Open-Meteo, dias 1-7). Guarda el escenario y en el mismo pedido genera la recomendacion (tarda 15-25 s). Si la IA falla igual responde 201 con estado ERROR y recomendacion null: reintentar con POST /agro/simulaciones/:id/recomendacion.',
  })
  @ApiCreatedResponse({ type: SimulacionRespuestaDto })
  @ApiBadRequestResponse({
    description:
      'Body invalido, lote no activo, fechas repetidas o serie de mas de 7 dias corridos',
  })
  @ApiNotFoundResponse({ description: 'El lote o la etapa no existen' })
  @ApiServiceUnavailableResponse({
    description: 'Con fuente API: Open-Meteo no respondio (no se guarda nada)',
  })
  create(@Body() dto: CreateSimulacionDto, @GetUser() user: User) {
    return this.simulacionService.create(dto, user);
  }

  @Get()
  @Auth(ValidPermissions.SIMULACION_GET_ALL)
  @ApiOperation({ summary: 'Lista paginada de simulaciones' })
  @ApiOkResponse({ type: SimulacionesRespuestaDto })
  findAll(@Query() filter: QueryDto) {
    return this.simulacionService.findAll(filter);
  }

  @Get(':id')
  @Auth(ValidPermissions.SIMULACION_GET_ONE)
  @ApiOperation({
    summary: 'Detalle con clima y recomendacion',
  })
  @ApiOkResponse({ type: SimulacionRespuestaDto })
  @ApiNotFoundResponse({ description: 'La simulacion no existe' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.simulacionService.findOne(id);
  }

  /** Reintenta la recomendacion de una simulacion que quedo en ERROR. Sin body. */
  @Post(':id/recomendacion')
  @Auth(ValidPermissions.SIMULACION_POST)
  @ApiOperation({
    summary: 'Reintenta la recomendacion de una simulacion en ERROR',
    description:
      'Sin body. Solo para simulaciones en estado ERROR; vuelve a pedirle la recomendacion a la IA con el escenario ya guardado.',
  })
  @ApiCreatedResponse({ type: SimulacionRespuestaDto })
  @ApiNotFoundResponse({ description: 'La simulacion no existe' })
  @ApiConflictResponse({ description: 'La simulacion ya tiene recomendacion' })
  @ApiServiceUnavailableResponse({
    description: 'No se pudo generar; la simulacion queda en ERROR',
  })
  recomendar(@Param('id', ParseIntPipe) id: number) {
    return this.simulacionService.recomendar(id);
  }
}
