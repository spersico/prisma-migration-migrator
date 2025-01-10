export type TestParameters = {
  strategy: 'co-located' | 'standalone';
  dbUrl: string;
  altDbUrl?: string;
  silent?: boolean;
};
