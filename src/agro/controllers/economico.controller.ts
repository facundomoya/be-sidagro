import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
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
import { Auth } from '../../auth/decorators/auth.decorator';
import { ValidPermissions } from '../../auth/enums/valid-permissions';
import { CreateCostoDto } from '../dto/create-costo.dto';
import { DashboardQueryDto } from '../dto/dashboard-query.dto';
import {
  AnalisisLoteRespuestaDto,
  CostoRespuestaDto,
  CostosRespuestaDto,
  DashboardRespuestaDto,
  PreciosRespuestaDto,
  PrecioVigenteRespuestaDto,
} from '../dto/economico-response.dto';
import { PaginacionOpcionalDto } from '../dto/paginacion-opcional.dto';
import { EconomicoService } from '../economico/economico.service';

const SIN_PRECIO = 'La pizarra no respondio y no hay precios guardados';
const SIN_COSTO = 'No hay un costo de produccion vigente';

@ApiTags('Agro - Modulo economico')
@Controller('agro/economico')
export class EconomicoController {
  constructor(private readonly economicoService: EconomicoService) {}

  @Get('dashboard')
  @Auth(ValidPermissions.ECONOMICO_GET)
  @ApiOperation({
    summary: 'Dashboard economico de la gerencia',
    description:
      'Precio de la soja, costo vigente, indicadores de cada lote (ingreso, costo, ganancia por ha y total) y totales. Los lotes sin superficie o rendimiento vienen con indicadores null y la lista de faltantes.',
  })
  @ApiOkResponse({ type: DashboardRespuestaDto })
  @ApiConflictResponse({ description: SIN_COSTO })
  @ApiServiceUnavailableResponse({ description: SIN_PRECIO })
  dashboard(@Query() filtros: DashboardQueryDto) {
    return this.economicoService.dashboard(filtros);
  }

  @Get('lotes/:loteId')
  @Auth(ValidPermissions.ECONOMICO_GET)
  @ApiOperation({ summary: 'Indicadores economicos de un lote' })
  @ApiOkResponse({ type: AnalisisLoteRespuestaDto })
  @ApiNotFoundResponse({ description: 'El lote no existe' })
  @ApiConflictResponse({ description: SIN_COSTO })
  @ApiServiceUnavailableResponse({ description: SIN_PRECIO })
  analisisLote(@Param('loteId', ParseIntPipe) loteId: number) {
    return this.economicoService.analisisLote(loteId);
  }

  @Get('precio-soja')
  @Auth(ValidPermissions.ECONOMICO_GET)
  @ApiOperation({
    summary: 'Precio de la soja (pizarra de Rosario)',
    description:
      'Se consulta como maximo una vez por hora y se guarda en precio_soja. Si la pizarra no responde devuelve el ultimo guardado con desactualizado=true y un aviso.',
  })
  @ApiOkResponse({ type: PrecioVigenteRespuestaDto })
  @ApiServiceUnavailableResponse({ description: SIN_PRECIO })
  precioActual() {
    return this.economicoService.precioActual();
  }

  @Get('precio-soja/historial')
  @Auth(ValidPermissions.ECONOMICO_GET)
  @ApiOperation({
    summary: 'Precios de la soja guardados',
    description:
      'Del mas reciente al mas viejo. Sin page ni limit devuelve todos en un array; con page o limit, una pagina.',
  })
  @ApiOkResponse({ type: PreciosRespuestaDto })
  @ApiBadRequestResponse({ description: 'page o limit invalidos' })
  historialPrecios(@Query() paginacion: PaginacionOpcionalDto) {
    return this.economicoService.historialPrecios(paginacion);
  }

  @Get('costos')
  @Auth(ValidPermissions.ECONOMICO_GET)
  @ApiOperation({ summary: 'Costos de produccion por hectarea cargados' })
  @ApiOkResponse({ type: CostosRespuestaDto })
  findCostos() {
    return this.economicoService.findCostos();
  }

  @Post('costos')
  @Auth(ValidPermissions.COSTO_POST)
  @ApiOperation({
    summary: 'Carga un costo de produccion por hectarea',
    description: 'Rige desde vigenciaDesde hasta que se cargue uno mas nuevo.',
  })
  @ApiCreatedResponse({ type: CostoRespuestaDto })
  @ApiBadRequestResponse({ description: 'Datos invalidos' })
  @ApiConflictResponse({ description: 'Ya hay un costo con esa vigenciaDesde' })
  createCosto(@Body() dto: CreateCostoDto) {
    return this.economicoService.createCosto(dto);
  }
}
