/// <reference path="../../../shared/custom-els/snack-bar/missing-types.d.ts" />
/// <reference path="../../../shared/custom-els/loading-spinner/missing-types.d.ts" />
import type {
  FileDropElement,
  FileDropEvent,
} from 'client/initial-app/custom-els/file-drop';

interface FileDropAttributes extends preact.JSX.HTMLAttributes {
  accept?: string;
  onfiledrop?: ((this: FileDropElement, ev: FileDropEvent) => any) | null;
}

declare module 'preact' {
  namespace createElement.JSX {
    interface IntrinsicElements {
      'file-drop': FileDropAttributes;
    }
  }
}

export {};
