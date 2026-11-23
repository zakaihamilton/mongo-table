/**
 * Case-insensitive substring check against the active filter term.
 */
export function matchesTerm(text, term) {
  return !term || String(text).toLowerCase().includes(term.toLowerCase());
}

/**
 * Returns true if a collection or any of its cached folders match the filter term.
 */
export function collectionMatches(dbId, colName, cache, term) {
  if (matchesTerm(colName, term)) return true;
  if (!term) return false;
  const colId = `${dbId}|col-${colName}`;
  const folders = cache[colId] || [];
  return folders.some((folder) => matchesTerm(folder, term));
}

/**
 * Returns true if a database or any of its cached collections/folders match the filter term.
 */
export function databaseMatches(connId, dbName, cache, term) {
  if (matchesTerm(dbName, term)) return true;
  const dbId = `${connId}|db-${dbName}`;
  const colList = cache[dbId] || [];
  return colList.some((col) => collectionMatches(dbId, col.name, cache, term));
}
