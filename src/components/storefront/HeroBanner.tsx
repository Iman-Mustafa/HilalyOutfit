import React from 'react';
import { Product } from '../../types';
import { HeroShowcase } from './HeroShowcase';

interface HeroBannerProps {
  products: Product[];
  onExploreClick: () => void;
}

const TRUST_POINTS = [
  { title: 'Usalama 100% wa Malipo', detail: 'Hakuna PIN inayohifadhiwa tovutini' },
  { title: 'Ufikishaji wa Haraka', detail: 'Dar es Salaam & Mikoa yote ya Tanzania' },
  { title: 'Ubora wa Kiwango cha Juu', detail: 'Vitambaa vya Kiitaliano & Dubai' }
];

export const HeroBanner: React.FC<HeroBannerProps> = ({ products, onExploreClick }) => {
  const featuredProducts = products.filter(product => product.featured && product.inStock);

  return (
    <section style={{ background: 'var(--bg-surface-elevated)' }}>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        alignItems: 'center',
        padding: '2.2rem 1.5rem',
        gap: '1.8rem'
      }}>
        {/* Left Content */}
        <div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.7rem, 3vw, 2.6rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: '0.9rem',
            color: 'var(--text-primary)'
          }}>
            Mavazi ya Kifahari na <br />
            <span className="gold-gradient-text">Hadhi ya Kipekee</span>
          </h1>

          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            lineHeight: 1.6,
            marginBottom: '1.5rem',
            maxWidth: '480px'
          }}>
            Kutana na mtindo bora zaidi wa suti za kisasa, abaya za kipekee, viatu halisi vya ngozi na vifaa vya dhahabu. Lipia kwa urahisi na usalama kupitia namba yako ya simu.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem', alignItems: 'center' }}>
            <button
              onClick={onExploreClick}
              className="btn btn-gold"
              style={{ padding: '0.8rem 1.6rem', fontSize: '0.95rem' }}
            >
              Chagua Mavazi Yako
            </button>

            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Malipo ya Papo Hapo kwa Simu
            </span>
          </div>
        </div>

        {/* Right Showcase: rotating featured products */}
        <HeroShowcase products={featuredProducts} />
      </div>

      {/* Trust Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        padding: '0.9rem 1.5rem',
        gap: '1rem'
      }}>
        {TRUST_POINTS.map(point => (
          <div key={point.title} style={{ borderLeft: '2px solid var(--gold-primary)', paddingLeft: '0.7rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{point.title}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{point.detail}</div>
          </div>
        ))}
      </div>

    </section>
  );
};
