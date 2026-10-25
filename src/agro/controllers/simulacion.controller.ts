import { ApiTags } from '@nestjs/swagger';
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
import { SimulacionService } from '../services/simulacion.service';

@ApiTags('Agro - Simulaciones')
@Controller('agro/simulaciones')
export class SimulacionController {
  constructor(private readonly simulacionService: SimulacionService) {}

  @Post()
  @Auth(ValidPermissions.SIMULACION_POST)
  create(@Body() dto: CreateSimulacionDto, @GetUser() user: User) {
    return this.simulacionService.create(dto, user);
  }

  @Get()
  @Auth(ValidPermissions.SIMULACION_GET_ALL)
  findAll(@Query() filter: QueryDto) {
    return this.simulacionService.findAll(filter);
  }

  @Get(':id')
  @Auth(ValidPermissions.SIMULACION_GET_ONE)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.simulacionService.findOne(id);
  }
}
