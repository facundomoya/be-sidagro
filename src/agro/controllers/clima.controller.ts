import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Auth } from '../../auth/decorators/auth.decorator';
import { ValidPermissions } from '../../auth/enums/valid-permissions';
import { ClimaService } from '../clima/clima.service';
import { PronosticoQueryDto } from '../dto/pronostico-query.dto';
import { PronosticoRespuestaDto } from '../dto/pronostico-response.dto';
import { MAX_DIAS_CLIMATICOS } from '../enums/agro.enums';

@ApiTags('Agro - Clima')
@Controller('agro/clima')
export class ClimaController {
  constructor(private readonly climaService: ClimaService) {}

  /** Vista previa del pronostico que usaria una simulacion con fuente API. */
  @Get('pronostico')
  @Auth(ValidPermissions.AGRO_PARAM_GET)
  @ApiOkResponse({ type: PronosticoRespuestaDto })
  @ApiBadRequestResponse({
    description: 'provinciaId faltante o dias fuera de 1-7',
  })
  @ApiNotFoundResponse({ description: 'La provincia no existe' })
  @ApiServiceUnavailableResponse({
    description: 'Open-Meteo no respondio, demoro o devolvio datos incompletos',
  })
  pronostico(@Query() query: PronosticoQueryDto) {
    return this.climaService.obtenerPronostico(
      query.provinciaId,
      query.dias ?? MAX_DIAS_CLIMATICOS,
    );
  }
}
