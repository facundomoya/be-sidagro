export function splitQuery(options: Record<string, any>) {
  const filters: Record<string, any> = {};

  // Valores pasados desde el codigo ({ takeAll: true }); los de la query los pisan.
  let page = Number(options.page) || 1;
  let limit = Number(options.limit) || 10;
  let takeAll = options.takeAll === true;

  Object.entries(options.filters ?? {}).forEach(([key, value]) => {
    if (key === 'page') {
      page = Number(value) || 1;
      return;
    }

    if (key === 'limit') {
      limit = Number(value) || 10;
      return;
    }

    if (key === 'takeAll') {
      takeAll = value === 'true' || value === true;
      return;
    }

    // 👉 todo lo demás es filtro
    filters[key] = value;
  });

  return { filters, page, limit, takeAll };
}
