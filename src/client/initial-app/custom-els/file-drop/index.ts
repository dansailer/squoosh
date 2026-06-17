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

function getMatchingItems(
  list: DataTransferItemList,
  acceptVal: string,
  multiple: boolean,
): DataTransferItem[] {
  const dataItems = Array.from(list);

  if (acceptVal === '') {
    const results = dataItems.filter((item) => item.kind === 'file');
    return multiple ? results : [results[0]];
  }

  const accepts = acceptVal
    .toLowerCase()
    .split(',')
    .map((accept) => accept.split('/').map((part) => part.trim()))
    .filter((acceptParts) => acceptParts.length === 2);

  const predicate = (item: DataTransferItem) => {
    if (item.kind !== 'file') return false;

    const [typeMain, typeSub] = item.type
      .toLowerCase()
      .split('/')
      .map((s) => s.trim());

    for (const [acceptMain, acceptSub] of accepts) {
      if (
        typeMain === acceptMain &&
        (acceptSub === '*' || typeSub === acceptSub)
      ) {
        return true;
      }
    }
    return false;
  };

  let results = dataItems.filter(predicate);
  if (!multiple) {
    results = [results[0]];
  }

  return results;
}

function getFileData(
  data: DataTransfer,
  accept: string,
  multiple: boolean,
): File[] {
  const dragDataItems = getMatchingItems(data.items, accept, multiple);
  const files: File[] = [];

  dragDataItems.forEach((item) => {
    const file = item.getAsFile();
    if (file) files.push(file);
  });

  return files;
}

function fixExtendedEvent(instance: Event, type: Function) {
  if (!(instance instanceof type)) {
    Object.setPrototypeOf(instance, type.prototype);
  }
}

interface FileDropEventInit extends EventInit {
  action: FileDropAccept;
  files: File[];
}

type FileDropAccept = 'drop' | 'paste';

export class FileDropEvent extends Event {
  private readonly _action: FileDropAccept;
  private readonly _files: File[];

  constructor(typeArg: string, eventInitDict: FileDropEventInit) {
    super(typeArg, eventInitDict);
    fixExtendedEvent(this, FileDropEvent);
    this._files = eventInitDict.files;
    this._action = eventInitDict.action;
  }

  get action() {
    return this._action;
  }

  get files() {
    return this._files;
  }
}

export class FileDropElement extends HTMLElement {
  private _dragEnterCount = 0;

  constructor() {
    super();

    this.addEventListener('dragover', (event) => event.preventDefault());
    this.addEventListener('drop', this._onDrop);
    this.addEventListener('dragenter', this._onDragEnter);
    this.addEventListener('dragend', () => this._reset());
    this.addEventListener('dragleave', this._onDragLeave);
    this.addEventListener('paste', this._onPaste);
  }

  get accept() {
    return this.getAttribute('accept') || '';
  }

  set accept(val: string) {
    this.setAttribute('accept', val);
  }

  get multiple(): string | null {
    return this.getAttribute('multiple');
  }

  set multiple(val: string | null) {
    this.setAttribute('multiple', val || '');
  }

  private _onDragEnter = (event: DragEvent) => {
    this._dragEnterCount += 1;
    if (this._dragEnterCount > 1) return;

    if (!event.dataTransfer) {
      this.classList.add('drop-invalid');
      return;
    }

    const matchingFiles = getMatchingItems(
      event.dataTransfer.items,
      this.accept,
      this.multiple !== null,
    );
    const validDrop = event.dataTransfer.items.length
      ? matchingFiles[0] !== undefined
      : true;

    this.classList.toggle('drop-valid', validDrop);
    this.classList.toggle('drop-invalid', !validDrop);
  };

  private _onDragLeave = () => {
    this._dragEnterCount -= 1;
    if (this._dragEnterCount === 0) {
      this._reset();
    }
  };

  private _onDrop = (event: DragEvent) => {
    event.preventDefault();
    if (!event.dataTransfer) return;
    this._reset();

    const files = getFileData(
      event.dataTransfer,
      this.accept,
      this.multiple !== null,
    );
    this.dispatchEvent(
      new FileDropEvent('filedrop', { action: 'drop', files }),
    );
  };

  private _onPaste = (event: ClipboardEvent) => {
    if (!event.clipboardData) return;

    const files = getFileData(
      event.clipboardData,
      this.accept,
      this.multiple !== null,
    );
    this.dispatchEvent(
      new FileDropEvent('filedrop', { action: 'paste', files }),
    );
  };

  private _reset() {
    this._dragEnterCount = 0;
    this.classList.remove('drop-valid');
    this.classList.remove('drop-invalid');
  }
}

customElements.define('file-drop', FileDropElement);