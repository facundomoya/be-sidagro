import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campania } from './entities/campania.entity';
import { DatoClimatico } from './entities/dato-climatico.entity';
import { EtapaFenologica } from './entities/etapa-fenologica.entity';
import { Lote } from './entities/lote.entity';
import { Provincia } from './entities/provincia.entity';
import { RecomendacionAgronomica } from './entities/recomendacion-agronomica.entity';
import { SimulacionEscenario } from './entities/simulacion-escenario.entity';
import { CommonModule } from '../common/common.module';
import { CatalogoController } from './controllers/catalogo.controller';
import { SimulacionController } from './controllers/simulacion.controller';
import { CatalogoService } from './services/catalogo.service';
import { SimulacionService } from './services/simulacion.service';
import { ClimaController } from './controllers/clima.controller';
import { ClimaService } from './clima/clima.service';
import { CLIMATE_PROVIDER } from './clima/climate-provider.interface';
import { OpenMeteoProvider } from './clima/open-meteo.provider';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([
      Campania,
      DatoClimatico,
      EtapaFenologica,
      Lote,
      Provincia,
      RecomendacionAgronomica,
      SimulacionEscenario,
    ]),
  ],
  controllers: [CatalogoController, SimulacionController, ClimaController],
  providers: [
    CatalogoService,
    SimulacionService,
    ClimaService,
    // Para cambiar de proveedor climatico basta con reemplazar useClass.
    { provide: CLIMATE_PROVIDER, useClass: OpenMeteoProvider },
  ],
  exports: [TypeOrmModule, CatalogoService, SimulacionService, ClimaService],
})
export class AgroModule {}
