import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { envConfig } from './src/config/env.validation';
import * as dotenv from 'dotenv';

dotenv.config();
console.log(envConfig);

export const appDataSource = new DataSource({
    type: 'mysql',
    host: envConfig.DB_HOST,
    port: envConfig.DB_PORT,
    username: envConfig.DB_USER,
    password: envConfig.DB_PASS,
    database: envConfig.DB_DATABASE,
    entities: [__dirname + '/src/**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/src/migrations/*{.ts,.js}'],
})