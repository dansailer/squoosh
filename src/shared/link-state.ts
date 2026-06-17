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

interface LinkStateComponent {
  state: object;
  setState: (state: object) => void;
  __lsc?: Record<string, (event: Event) => void>;
}

/** Bind a class component field to a form control's onChange handler. */
export default function linkState<C extends LinkStateComponent>(
  component: C,
  path: string,
  targetPath?: string,
): (event: Event) => void {
  const cache = component.__lsc || (component.__lsc = {});
  const key = path + (targetPath ?? '');

  if (!cache[key]) {
    const pathParts = path.split('.');

    cache[key] = (event: Event) => {
      const target = (event && (event as Event & { target?: EventTarget }).target) as
        | HTMLInputElement
        | undefined;
      let value: unknown;

      if (typeof targetPath === 'string') {
        value = getPath(event, targetPath);
      } else if (target?.nodeName) {
        value = target.type.match(/^che|rad/) ? target.checked : target.value;
      } else {
        value = event;
      }

      const stateUpdate: Record<string, unknown> = {};
      let cursor: Record<string, unknown> = stateUpdate;
      const componentState = component.state as Record<string, unknown>;

      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        cursor =
          (cursor[part] as Record<string, unknown>) ||
          (cursor[part] = i === 0 ? componentState[part] ?? {} : {});
      }

      cursor[pathParts[pathParts.length - 1]] = value;
      component.setState(stateUpdate);
    };
  }

  return cache[key];
}

function getPath(object: unknown, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = object;

  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}