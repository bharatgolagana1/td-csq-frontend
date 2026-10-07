import { Icon, ICON_NAMES } from '@/design/icons';

import styles from '../gallery.module.css';
import { Section } from '../Section';

export function IconsSection() {
  return (
    <Section id="icons" title="Icons" note="design/icons — inline SVG, 20px box, 1.5 stroke, currentColor. Decorative unless given a title.">
      <div className={styles.icons}>
        {ICON_NAMES.map((name) => (
          <div key={name} className={styles.iconCell}>
            <Icon name={name} />
            <span className={styles.iconName}>{name}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
