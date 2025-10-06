/// <reference types="react-scripts" />

declare module 'crypto' {
  const crypto: any;
  export = crypto;
}

declare module 'path' {
  const path: any;
  export = path;
}

declare module 'fs' {
  const fs: any;
  export = fs;
}
