export const imports = {
  'documentation/usage.mdx': () =>
    import(/* webpackPrefetch: true, webpackChunkName: "documentation-usage" */ 'documentation/usage.mdx'),
}
