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
import { ValidPermissions } from '../../auth/enums/valid-permissions';
import { CatalogoService } from '../services/catalogo.service';
import { CreateCampaniaDto } from '../dto/create-campania.dto';
import { CreateLoteDto } from '../dto/create-lote.dto';

@Controller('agro')
export class CatalogoController {
  constructor(private readonly catalogoService: CatalogoService) {}

  @Get('provincias')
  @Auth(ValidPermissions.AGRO_PARAM_GET)
  findProvincias() {
    return this.catalogoService.findProvincias();
  }

  @Get('etapas-fenologicas')
  @Auth(ValidPermissions.AGRO_PARAM_GET)
  findEtapas() {
    return this.catalogoService.findEtapas();
  }

  @Get('etapas-fenologicas/:id')
  @Auth(ValidPermissions.AGRO_PARAM_GET)
  findEtapa(@Param('id', ParseIntPipe) id: number) {
    return this.catalogoService.findEtapa(id);
  }

  @Get('campanias')
  @Auth(ValidPermissions.AGRO_PARAM_GET)
  findCampanias(@Query() filter: QueryDto) {
    return this.catalogoService.findCampanias(filter);
  }

  @Post('campanias')
  @Auth(ValidPermissions.CAMPANIA_POST)
  createCampania(@Body() dto: CreateCampaniaDto) {
    return this.catalogoService.createCampania(dto);
  }

  @Get('lotes')
  @Auth(ValidPermissions.AGRO_PARAM_GET)
  findLotes(@Query() filter: QueryDto) {
    return this.catalogoService.findLotes(filter);
  }

  @Get('lotes/:id')
  @Auth(ValidPermissions.AGRO_PARAM_GET)
  findLote(@Param('id', ParseIntPipe) id: number) {
    return this.catalogoService.findLote(id);
  }

  @Post('lotes')
  @Auth(ValidPermissions.LOTE_POST)
  createLote(@Body() dto: CreateLoteDto) {
    return this.catalogoService.createLote(dto);
  }
}
