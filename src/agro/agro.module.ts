import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Campania } from './entities/campania.entity';
import { DatoClimatico } from './entities/dato-climatico.entity';
import { EtapaFenologica } from './entities/etapa-fenologica.entity';
import { Lote } from './entities/lote.entity';
import { ObservacionMonitoreo } from './entities/observacion-monitoreo.entity';
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
import { RECOMMENDATION_PROVIDER } from './recomendacion/recommendation-provider.interface';
import { ReglasLocalesProvider } from './recomendacion/reglas-locales.provider';
import { MistralProvider } from './recomendacion/mistral.provider';
import { MonitoreoController } from './controllers/monitoreo.controller';
import { MonitoreoService } from './monitoreo/monitoreo.service';

@Module({
  imports: [
    CommonModule,
    TypeOrmModule.forFeature([
      Campania,
      DatoClimatico,
      EtapaFenologica,
      Lote,
      ObservacionMonitoreo,
      Provincia,
      RecomendacionAgronomica,
      SimulacionEscenario,
    ]),
  ],
  controllers: [
    CatalogoController,
    SimulacionController,
    ClimaController,
    MonitoreoController,
  ],
  providers: [
    CatalogoService,
    SimulacionService,
    ClimaService,
    MonitoreoService,
    // Para cambiar de proveedor climatico basta con reemplazar useClass.
    { provide: CLIMATE_PROVIDER, useClass: OpenMeteoProvider },
    // IA_PROVEEDOR=mistral usa la IA con los documentos; si no, reglas locales.
    {
      provide: RECOMMENDATION_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        config.get<string>('IA_PROVEEDOR') === 'mistral'
          ? new MistralProvider(config)
          : new ReglasLocalesProvider(),
    },
  ],
  exports: [TypeOrmModule, CatalogoService, SimulacionService, ClimaService],
})
export class AgroModule {}
