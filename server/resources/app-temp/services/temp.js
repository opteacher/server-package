/*return Object.values(Object.fromEntries(services.map(svc => svc.deps).filter(deps => deps).flat().map(dep => [dep.name, dep]))).map(dep => `import ${dep.default ? dep.exports[0] : ('{ ' + dep.exports.join(', ') + ' }')} from '${dep.from}'`).join('\n')*/

/*return (stcVars || []).map(v => `// ${v.remark}\nvar ${v.name} = ${genDefault(v.vtype, v.dftVal)}\n`).join('\n')*/

/*return services.map(svc => `export async function ${svc.interface} (ctx) {\n  try {\n${svc.codes}\n  } catch (e) {\n    console.error(e)\n    ctx.throw(400, e.message || JSON.stringify(e))\n  }\n}`).join('\n')*/
