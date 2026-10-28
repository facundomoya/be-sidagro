import * as Joi from 'joi';
import * as dotenv from 'dotenv';
import { type StringValue } from 'ms';

const envFile = `.env.${process.env.NODE_ENV || 'local'}`;
dotenv.config({ path: envFile });

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('local', 'development', 'production', 'test')
    .default('local'),

  PORT: Joi.number().default(3000),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().required(),
  DB_USER: Joi.string().required(),
  DB_PASS: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  DB_DIALECT: Joi.string()
    .valid('mysql', 'postgres', 'sqlite', 'mariadb', 'mssql')
    .required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('3600s'),

  STORAGE_TYPE: Joi.string().valid('fs', 'sftp').default('fs'),
  STORAGE_BASE_PATH: Joi.string().default('.'),

  SFTP_HOST: Joi.string().when('STORAGE_TYPE', {
    is: 'sftp',
    then: Joi.required(),
  }),
  SFTP_PORT: Joi.number()
    .default(22)
    .when('STORAGE_TYPE', { is: 'sftp', then: Joi.required() }),
  SFTP_USERNAME: Joi.string().when('STORAGE_TYPE', {
    is: 'sftp',
    then: Joi.required(),
  }),
  SFTP_PASSWORD: Joi.string().when('STORAGE_TYPE', {
    is: 'sftp',
    then: Joi.required(),
  }),

  IA_PROVEEDOR: Joi.string().valid('reglas', 'mistral').default('reglas'),
  MISTRAL_API_KEY: Joi.string().when('IA_PROVEEDOR', {
    is: 'mistral',
    then: Joi.required(),
  }),
  MISTRAL_MODEL: Joi.string().allow(''),
  MISTRAL_TIMEOUT_MS: Joi.number().allow(''),
  IA_INDICE_PATH: Joi.string().allow(''),
}).messages({
  'any.required': `The variable {#label} is required in the file ${envFile}`,
  'string.base': `The variable {#label} must be a string in the file ${envFile}`,
  'number.base': `The variable {#label} must be a number in the file ${envFile}`,
  'any.only': `The variable {#label} must be one of the allowed values in the file ${envFile}`,
});

export interface EnvInterface {
  NODE_ENV: 'local' | 'development' | 'production' | 'test';
  PORT: number;
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASS: string;
  DB_DATABASE: string;
  DB_DIALECT: 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql';
  JWT_SECRET: string;
  JWT_EXPIRES_IN: StringValue;
}

export const envConfig: EnvInterface = {
  NODE_ENV: process.env.NODE_ENV as
    | 'local'
    | 'development'
    | 'production'
    | 'test',
  PORT: Number(process.env.PORT),
  DB_HOST: process.env.DB_HOST as string,
  DB_PORT: Number(process.env.DB_PORT),
  DB_USER: process.env.DB_USER as string,
  DB_PASS: process.env.DB_PASS as string,
  DB_DATABASE: process.env.DB_DATABASE as string,
  DB_DIALECT: process.env.DB_DIALECT as
    | 'mysql'
    | 'postgres'
    | 'sqlite'
    | 'mariadb'
    | 'mssql',
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN ?? '3600s') as StringValue,
};
