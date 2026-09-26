export function splitQuery(options: Record<string, any>) {
  const filters: Record<string, any> = {};

  let page = 1;
  let limit = 10;
  let takeAll = false;

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
