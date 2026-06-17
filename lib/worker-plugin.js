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
import amdLoader from './amd-loader.js';

const importPrefix = 'worker:';

export default function workerPlugin({ loader = amdLoader } = {}) {
  /** @type {string[]} */
  let workerFiles = [];
  /** @type {() => boolean} */
  let isEsmOutput = () => {
    throw new Error("outputOptions hasn't been called yet");
  };

  return {
    name: 'worker',

    buildStart() {
      workerFiles = [];
    },

    async resolveId(id, importer) {
      if (!id.startsWith(importPrefix)) return;

      const path = id.slice(importPrefix.length);
      const resolved = await this.resolve(path, importer);
      if (!resolved) {
        throw Error(`Cannot find module '${path}' from '${importer}'`);
      }

      return importPrefix + resolved.id;
    },

    load(id) {
      if (!id.startsWith(importPrefix)) return;

      const realId = id.slice(importPrefix.length);
      const chunkRef = this.emitFile({ id: realId, type: 'chunk' });
      return `export default import.meta.ROLLUP_FILE_URL_${chunkRef};`;
    },

    outputOptions({ format }) {
      if (format === 'esm' || format === 'es') {
        isEsmOutput = () => true;
      } else if (format !== 'amd') {
        this.error(
          `\`output.format\` must either be "amd" or "esm", got "${format}"`,
        );
      } else {
        isEsmOutput = () => false;
      }
    },

    renderDynamicImport() {
      if (isEsmOutput()) return;

      return {
        left: 'require(',
        right: ')',
      };
    },

    resolveImportMeta(property) {
      if (isEsmOutput()) return;

      if (property === 'url') {
        return `module.uri`;
      }
    },

    renderChunk(code, chunk, outputOptions) {
      if (isEsmOutput()) return;

      if (outputOptions.banner && outputOptions.banner.length > 0) {
        this.error(
          'worker-plugin currently doesn’t work with `banner`',
        );
      }

      let newCode = code;

      // Mangle define() call
      if (newCode.startsWith('define(')) {
        newCode = newCode.slice('define('.length);
        if (!newCode.startsWith('[')) {
          newCode = '[],' + newCode;
        }
        newCode = 'define(' + newCode;
      }

      const prependLoader =
        chunk.isEntry || workerFiles.includes(chunk.facadeModuleId);
      if (prependLoader) {
        newCode = loader + newCode;
      }

      if (newCode === code) return null;

      return { code: newCode, map: null };
    },
  };
}