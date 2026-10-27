import { readFile } from 'fs/promises';

/** Un pedazo de un documento con su embedding (lo genera npm run ia:indexar). */
export interface Fragmento {
  id: string;
  archivo: string;
  pagina: number;
  texto: string;
  vector: number[];
}

export interface IndiceDocumentos {
  modeloEmbedding: string;
  creado: string;
  fragmentos: Fragmento[];
}

const similitudCoseno = (a: number[], b: number[]) => {
  let producto = 0;
  let normaA = 0;
  let normaB = 0;
  for (let i = 0; i < a.length; i++) {
    producto += a[i] * b[i];
    normaA += a[i] * a[i];
    normaB += b[i] * b[i];
  }
  return producto / (Math.sqrt(normaA) * Math.sqrt(normaB) || 1);
};

/**
 * Documentos de referencia indexados. Se cargan del archivo la primera vez
 * que se usan, asi el backend arranca aunque todavia no se haya indexado.
 */
export class BaseConocimiento {
  private indice?: IndiceDocumentos;

  constructor(private readonly ruta: string) {}

  async cargar(): Promise<IndiceDocumentos> {
    if (!this.indice) {
      let contenido: string;
      try {
        contenido = await readFile(this.ruta, 'utf-8');
      } catch {
        throw new Error(
          `No existe el indice de documentos (${this.ruta}). Ejecute npm run ia:indexar`,
        );
      }
      this.indice = JSON.parse(contenido) as IndiceDocumentos;
    }
    return this.indice;
  }

  /** Los fragmentos mas parecidos a cada consulta, sin repetir. */
  async buscar(
    consultas: number[][],
    porConsulta: number,
  ): Promise<Fragmento[]> {
    const { fragmentos } = await this.cargar();
    const elegidos = new Map<string, Fragmento>();
    for (const consulta of consultas) {
      fragmentos
        .map((f) => ({ f, puntaje: similitudCoseno(consulta, f.vector) }))
        .sort((a, b) => b.puntaje - a.puntaje)
        .slice(0, porConsulta)
        .forEach(({ f }) => elegidos.set(f.id, f));
    }
    return [...elegidos.values()];
  }
}
