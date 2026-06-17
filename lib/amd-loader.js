/**
 * Copyright 2021 Google Inc. All Rights Reserved.
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

// AMD loader for worker and main-thread bundles.
export default `// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  const singleRequire = (uri, parentUri) => {
    uri = uri.startsWith(location.origin) ? uri : new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
        new Promise(resolve => {
          if ("document" in self) {
            const link = document.createElement("link");
            link.rel = "preload";
            link.as = "script";
            link.href = uri;
            link.onload = () => {
              const script = document.createElement("script");
              script.src = uri;
              script.onload = resolve;
              document.head.appendChild(script);
            };
            document.head.appendChild(link);
          } else {
            self.nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(\`Module \${uri} didn’t register its module\`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = self.nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.resolve().then(() => Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    ))).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
`;