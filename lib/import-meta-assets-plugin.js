/**
 * Copyright 2020 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { promises as fsp } from 'fs';
import path from 'path';
import { createFilter } from '@rollup/pluginutils';
import { asyncWalk } from 'estree-walker';
import MagicString from 'magic-string';

function getRelativeAssetPath(node) {
  const browserPath = node.arguments[0].value;
  return browserPath.split('/').join(path.sep);
}

function isNewUrlImportMetaUrl(node) {
  return (
    node.type === 'NewExpression' &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'URL' &&
    node.arguments.length === 2 &&
    node.arguments[0].type === 'Literal' &&
    typeof getRelativeAssetPath(node) === 'string' &&
    node.arguments[1].type === 'MemberExpression' &&
    node.arguments[1].object.type === 'MetaProperty' &&
    node.arguments[1].property.type === 'Identifier' &&
    node.arguments[1].property.name === 'url'
  );
}

export default function importMetaAssets({
  include,
  exclude,
  warnOnError,
  transform,
} = {}) {
  const filter = createFilter(include, exclude);

  return {
    name: 'import-meta-assets',

    async transform(code, id) {
      if (!filter(id)) return null;

      const ast = this.parse(code);
      const magicString = new MagicString(code);
      let modifiedCode = false;

      await asyncWalk(ast, {
        enter: async (node) => {
          if (!isNewUrlImportMetaUrl(node)) return;

          const absoluteScriptDir = path.dirname(id);
          const relativeAssetPath = getRelativeAssetPath(node);
          const absoluteAssetPath = path.resolve(
            absoluteScriptDir,
            relativeAssetPath,
          );
          const assetName = path.basename(absoluteAssetPath);

          try {
            const assetContents = await fsp.readFile(absoluteAssetPath);
            const transformedAssetContents =
              transform != null
                ? await transform(assetContents, absoluteAssetPath)
                : assetContents;
            const ref = this.emitFile({
              type: 'asset',
              name: assetName,
              source: transformedAssetContents,
            });
            magicString.overwrite(
              node.arguments[0].start,
              node.arguments[0].end,
              `import.meta.ROLLUP_FILE_URL_${ref}`,
            );
            modifiedCode = true;
          } catch (error) {
            if (warnOnError) {
              this.warn(error, node.arguments[0].start);
            } else {
              this.error(error, node.arguments[0].start);
            }
          }
        },
      });

      return {
        code: magicString.toString(),
        map: modifiedCode ? magicString.generateMap({ hires: true }) : null,
      };
    },
  };
}