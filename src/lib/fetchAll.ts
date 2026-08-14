/**
 * Utilitários para buscar TODAS as linhas do banco.
 * O PostgREST limita respostas a 1000 linhas por padrão — leis grandes
 * (CC, CPP, CF/88) ultrapassam esse limite e o conteúdo ficava truncado.
 */

const PAGE_SIZE = 1000;
const ID_CHUNK = 300;

/**
 * Executa uma query paginando com .range() até trazer todas as linhas.
 * `build` recebe o intervalo e deve retornar a query pronta.
 */
export async function fetchAllPaged<T = any>(
  build: (from: number, to: number) => any
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await build(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const rows = (data ?? []) as T[];
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

/**
 * Igual ao anterior, mas quebrando também a lista de IDs em blocos,
 * evitando URLs gigantes no filtro `.in()`.
 */
export async function fetchAllByIds<T = any>(
  ids: string[],
  build: (chunk: string[], from: number, to: number) => any
): Promise<T[]> {
  const all: T[] = [];
  for (let i = 0; i < ids.length; i += ID_CHUNK) {
    const chunk = ids.slice(i, i + ID_CHUNK);
    const rows = await fetchAllPaged<T>((from, to) => build(chunk, from, to));
    all.push(...rows);
  }
  return all;
}
