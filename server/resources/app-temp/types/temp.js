/*return 'import ' + typo.super.exports[0] + ' from \'' + typo.super.from.replaceAll('../types/', './') + '\''*/
/*return Object.values(Object.fromEntries(typo.funcs.map(func => func.deps).flat().map(dep => [dep.name, dep]))).map(dep => `import ${dep.default ? dep.exports[0] : ('{ ' + dep.exports.join(', ') + ' }')} from '${dep.from}'`).join('\n')*/

export default class /*return typo.name + (typo.super ? ` extends ${typo.super.exports[0]}` : '')*/ {
  /*return '/**'*/
  /*return typo.label ? '* '  + typo.label : ''*/
  /*return typo.props.map(prop => `* @param {${prop.name}} [${prop.ptype}]: ${prop.label}`).join('\n  ')*/
  /*return '*\/'*/
  constructor(/*return (typo.params || []).concat(typo.props.filter(prop => prop.index).map(prop => `p_${prop.name}`)).join(', ')*/) {
    /*return typo.super ? `super(${typo.params.join(', ')})` : ''*/
    /*return typo.props.map(prop => `this.${prop.name} = ${prop.index ? 'p_' + prop.name : genDefault(prop.ptype, prop.dftVal)}`).join('\n    ')*/
  }

/*return typo.funcs.map(func => `${genFuncAnno(func)}\n  ${func.isAsync ? 'async ' : ''}${func.name} (${func.args.map(arg => arg.name).join(', ')}) {\n${func.codes}\n  }\n`).join('\n')*/
}