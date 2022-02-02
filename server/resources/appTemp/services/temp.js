/*return api.deps.filter(dep => dep.name !== 'WebModule').map(dep => `import ${dep.default ? dep.exports[0] : ('{ ' + dep.exports.join(', ') + ' }')} from '${dep.from}'`).join('\n')*/

/*return `export async function ${api.interface} (params, query, body) {\n${nodes.join('\n')}\n}`*/
