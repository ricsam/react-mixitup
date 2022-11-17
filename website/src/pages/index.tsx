import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import clsx from 'clsx';
import React from 'react';
import { Shuffle } from '../components/Shuffle';
import styles from './index.module.css';

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Animate the addition, removal and shuffling of elements in react"
    >
      <main>
        <header className={clsx('hero', styles.heroBanner)}>
          <div className="container">
            <h1 className="hero__title">{siteConfig.title}</h1>
            <p className="hero__subtitle">{siteConfig.tagline}</p>
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Shuffle />
            </div>
          </div>
        </header>
      </main>
    </Layout>
  );
}
