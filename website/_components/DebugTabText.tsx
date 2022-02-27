import React from 'react';
import Link from '@docusaurus/Link';


export const DebugTabText = () => {
  return (
    <p>
      This shows how to debug the frames which are next up to be rendered using the <code>debugMeasure</code> prop.
      The can be useful if your animation is not behaving as you'd expect.
      The <Link to="/docs/terminology#measure">measure frame</Link> should have
      the same size as the <Link to="/docs/terminology#stale">stale frame</Link>.
    </p>
  );
};
