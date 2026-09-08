import {createRequire} from 'node:module';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import ts from 'typescript';
const require=createRequire(import.meta.url);
export function loadSource(file, overrides={}) {
  const filename=resolve(file), module={exports:{}};
  const code=ts.transpileModule(readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
  new Function('require','module','exports',code)(name=>{
    if (name in overrides) return overrides[name];
    if (name.endsWith('.css')) return {};
    if (!name.startsWith('.')) return require(name);
    const path=resolve(dirname(filename),name);
    const target=[path,path+'.ts',path+'.tsx',path+'.mjs'].find(existsSync);
    if (!target) throw Error(name);
    return loadSource(target,overrides);
  },module,module.exports);
  return module.exports;
}
