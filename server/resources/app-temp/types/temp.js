/*return Object.values(Object.fromEntries(typo.funcs.map(func => func.deps).flat().map(dep => [dep.name, dep]))).map(dep => `import ${dep.default ? dep.exports[0] : ('{ ' + dep.exports.join(', ') + ' }')} from '${dep.from}'`).join('\n')*/

export class /*return typo.name*/ {
  /**
   * 
   */
  constructor(/*return typo.props.filter(prop => prop.index).map(prop => `p_${prop.name}`).join(', ')*/) {
    /*return typo.props.map(prop => `this.${prop.name} = ${prop.index ? 'p_' + prop.name : genDefault(prop.ptype, prop.dftVal)}`).join('\n    ')*/
  }

/*return typo.funcs.map(func => `  ${func.name} (${func.args.map(arg => arg.name).join(', ')}) {\n${func.codes}\n  }\n`).join('\n')*/
}