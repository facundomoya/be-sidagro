import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { QueryDto } from '../../common/dtos/baseQuery.dto';
import { Auth } from '../../auth/decorators/auth.decorator';
import { ValidPermissions } from '../../auth/enums/valid-permissions';
import { CatalogoService } from '../services/catalogo.service';
import { CreateCampaniaDto } from '../dto/create-campania.dto';
import { CreateLoteDto } from '../dto/create-lote.dto';
import { UpdateLoteDto } from '../dto/update-lote.dto';
import {
  CampaniaRespuestaDto,
  CampaniasRespuestaDto,
  EtapaRespuestaDto,
  EtapasRespuestaDto,
  LoteRespuestaDto,
  LotesRespuestaDto,
  ProvinciasRespuestaDto,
} from '../dto/catalogo-response.dto';

@ApiTags('Agro - Catálogo')
@Controller('agro')
export class CatalogoController {
  constructor(private readonly catalogoService: CatalogoService) {}

  @Get('provincias')
  @Auth(ValidPermissions.AGRO_PARAM_GET)
  @ApiOperation({ summary: 'Provincias (San Luis y Santiago del Estero)' })
  @ApiOkResponse({ type: ProvinciasRespuestaDto })
  findProvincias() {
    return this.catalogoService.findProvincias();
  }

  @Get('etapas-fenologicas')
  @Auth(ValidPermissions.AGRO_PARAM_GET)
  @ApiOperation({
    summary: 'Etapas fenologicas con GDDA, frecuencia de monitoreo y riesgo',
  })
  @ApiOkResponse({ type: EtapasRespuestaDto })
  findEtapas() {
    return this.catalogoService.findEtapas();
  }

  @Get('etapas-fenologicas/:id')
  @Auth(ValidPermissions.AGRO_PARAM_GET)
  @ApiOperation({ summary: 'Una etapa fenologica' })
  @ApiOkResponse({ type: EtapaRespuestaDto })
  @ApiNotFoundResponse({ description: 'La etapa no existe' })
  findEtapa(@Param('id', ParseIntPipe) id: number) {
    return this.catalogoService.findEtapa(id);
  }

  @Get('campanias')
  @Auth(ValidPermissions.AGRO_PARAM_GET)
  @ApiOperation({ summary: 'Lista paginada de campanias' })
  @ApiOkResponse({ type: CampaniasRespuestaDto })
  findCampanias(@Query() filter: QueryDto) {
    return this.catalogoService.findCampanias(filter);
  }

  @Post('campanias')
  @Auth(ValidPermissions.CAMPANIA_POST)
  @ApiOperation({ summary: 'Crea una campania' })
  @ApiCreatedResponse({ type: CampaniaRespuestaDto })
  @ApiBadRequestResponse({
    description: 'Body invalido o fechaFin anterior a fechaInicio',
  })
  @ApiConflictResponse({ description: 'Ya existe una campania con ese nombre' })
  createCampania(@Body() dto: CreateCampaniaDto) {
    return this.catalogoService.createCampania(dto);
  }

  @Get('lotes')
  @Auth(ValidPermissions.AGRO_PARAM_GET)
  @ApiOperation({ summary: 'Lista paginada de lotes con provincia y campania' })
  @ApiOkResponse({ type: LotesRespuestaDto })
  findLotes(@Query() filter: QueryDto) {
    return this.catalogoService.findLotes(filter);
  }

  @Get('lotes/:id')
  @Auth(ValidPermissions.AGRO_PARAM_GET)
  @ApiOperation({ summary: 'Un lote con provincia y campania' })
  @ApiOkResponse({ type: LoteRespuestaDto })
  @ApiNotFoundResponse({ description: 'El lote no existe' })
  findLote(@Param('id', ParseIntPipe) id: number) {
    return this.catalogoService.findLote(id);
  }

  @Post('lotes')
  @Auth(ValidPermissions.LOTE_POST)
  @ApiOperation({
    summary: 'Crea un lote',
    description:
      'fechaSiembra es opcional, pero el monitoreo de chinche verde la necesita.',
  })
  @ApiCreatedResponse({ type: LoteRespuestaDto })
  @ApiBadRequestResponse({ description: 'Body invalido' })
  @ApiNotFoundResponse({ description: 'La provincia o la campania no existen' })
  createLote(@Body() dto: CreateLoteDto) {
    return this.catalogoService.createLote(dto);
  }

  /** Por ejemplo, para cargar la fecha de siembra que usa el monitoreo. */
  @Patch('lotes/:id')
  @Auth(ValidPermissions.LOTE_PUT)
  @ApiOperation({
    summary: 'Modifica un lote (por ejemplo, la fecha de siembra)',
    description:
      'Solo se mandan los campos a cambiar. La provincia y la campania no se modifican.',
  })
  @ApiOkResponse({ type: LoteRespuestaDto })
  @ApiBadRequestResponse({ description: 'Body invalido' })
  @ApiNotFoundResponse({ description: 'El lote no existe' })
  updateLote(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLoteDto,
  ) {
    return this.catalogoService.updateLote(id, dto);
  }
}
