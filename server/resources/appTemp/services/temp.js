/*return Object.values(Object.fromEntries(apis.map(api => api.deps.filter(dep => dep.name !== 'WebModule')).flat().map(dep => [dep.name, dep]))).map(dep => `import ${dep.default ? dep.exports[0] : ('{ ' + dep.exports.join(', ') + ' }')} from '${dep.from}'`).join('\n')*/

/*return apis.map(api => `export async function ${api.interface} (params, query, body) {\n${api.nodes.join('\n')}\n}`).join('\n')*/
