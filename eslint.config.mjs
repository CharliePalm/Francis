import pluginJs from "@eslint/js";
import tslint from "typescript-eslint";


export default [
  pluginJs.configs.recommended,
  ...tslint.configs.recommended,
  ...tslint.configs.strict,
  ...tslint.configs.stylistic,
];