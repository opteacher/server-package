/*return Object.values(Object.fromEntries(svcs.map(svc => svc.deps.filter(dep => dep.name !== 'WebModule')).flat().map(dep => [dep.name, dep]))).map(dep => `import ${dep.default ? dep.exports[0] : ('{ ' + dep.exports.join(', ') + ' }')} from '${dep.from}'`).join('\n')*/

/*return svcs.map(svc => `export async function ${svc.interface} (params, query, body) {\n${svc.nodes.join('\n\n')}\n}`).join('\n')*/
