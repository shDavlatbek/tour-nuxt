<script setup lang="ts">
const { locale, locales, t } = useI18n()
const switchLocalePath = useSwitchLocalePath()

interface SocialLink {
    name: string
    url: string
    icon: string
}

const socialLinks: SocialLink[] = [
    { name: 'Instagram', url: '#', icon: 'mdi:instagram' },
    { name: 'Telegram', url: '#', icon: 'mdi:telegram' },
    { name: 'Facebook', url: '#', icon: 'mdi:facebook' },
    { name: 'YouTube', url: '#', icon: 'mdi:youtube' }
]

interface CorpInfo {
    address: string
    email: string
    phone: string
}

const corpInfo: CorpInfo = {
    address: 'Tashkent, Uzbekistan',
    email: 'info@uzbekistan.travel',
    phone: '+998 71 200 00 00'
}

interface LocaleObject {
    code: string
    name: string
}

function onLocaleChange(event: Event) {
    const target = event.target as HTMLSelectElement
    const code = target.value
    const path = switchLocalePath(code as any)
    navigateTo(path, { replace: true })
}
</script>

<template>
    <footer class="app-footer">
        <div class="footer-wrapper">
            <!-- Top accent line -->
            <div class="footer-accent" />

            <div class="footer-grid">
                <!-- Brand Column -->
                <div class="footer-brand">
                    <div class="logo">
                        <Icon name="mdi:compass-rose" class="logo-icon" />
                        <span class="logo-text">Uzbekistan Travel</span>
                    </div>
                    <p class="brand-desc">
                        {{ t('footer.description', 'Discover the hidden gems of Uzbekistan. ' +
                            'Experience the culture, history, and beauty of our villages.') }}
                    </p>
                    <div class="social-links">
                        <a v-for="link in socialLinks" :key="link.name" :href="link.url" class="social-link"
                            target="_blank" rel="noopener noreferrer" :aria-label="link.name">
                            <Icon :name="link.icon" />
                        </a>
                    </div>
                </div>

                <!-- Contact Column -->
                <div class="footer-section">
                    <h3 class="section-title">{{ t('footer.contact', 'Contact Us') }}</h3>
                    <ul class="contact-list">
                        <li>
                            <Icon name="mdi:map-marker-outline" class="contact-icon" />
                            <span>{{ corpInfo.address }}</span>
                        </li>
                        <li>
                            <Icon name="mdi:email-outline" class="contact-icon" />
                            <a :href="`mailto:${corpInfo.email}`">{{ corpInfo.email }}</a>
                        </li>
                        <li>
                            <Icon name="mdi:phone-outline" class="contact-icon" />
                            <a :href="`tel:${corpInfo.phone}`">{{ corpInfo.phone }}</a>
                        </li>
                    </ul>
                </div>

                <!-- Quick Links Column -->
                <!-- <div class="footer-section">
                    <h3 class="section-title">{{ t('footer.explore', 'Explore') }}</h3>
                    <ul class="quick-links">
                        <li><a href="#">{{ t('footer.villages', 'Tourism Villages') }}</a></li>
                        <li><a href="#">{{ t('footer.cities', 'Cities') }}</a></li>
                        <li><a href="#">{{ t('footer.about', 'About Us') }}</a></li>
                    </ul>
                </div> -->

                <!-- Language Column -->
                <div class="footer-section">
                    <h3 class="section-title">{{ t('footer.language', 'Language') }}</h3>
                    <div class="lang-select-wrapper">
                        <Icon name="mdi:translate" class="lang-icon" />
                        <select :value="locale" class="lang-select" @change="onLocaleChange"
                            :aria-label="t('footer.language', 'Language')">
                            <option v-for="loc in (locales as LocaleObject[])" :key="loc.code" :value="loc.code">
                                {{ loc.name }}
                            </option>
                        </select>
                        <Icon name="mdi:chevron-down" class="lang-chevron" />
                    </div>
                </div>
            </div>

            <!-- Bottom bar -->
            <div class="footer-bottom">
                <p>&copy; {{ new Date().getFullYear() }} Uzbekistan Travel.
                    {{ t('footer.rights', 'All rights reserved.') }}</p>
            </div>
        </div>
    </footer>
</template>

<style scoped>
.app-footer {
    /* background: linear-gradient(180deg, #0f1a1c 0%, #1a2e31 100%); */
    background: #1a1a1a;
    color: rgba(255, 255, 255, 0.75);
    font-family: var(--font-primary, 'Outfit', sans-serif);
    position: relative;
    z-index: 100;
}

.footer-accent {
    height: 3px;
    background: linear-gradient(90deg,
            transparent 0%,
            var(--gold-color, #c5a13e) 20%,
            var(--gold-color, #c5a13e) 80%,
            transparent 100%);
    opacity: 0.6;
}

.footer-wrapper {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0;
}

.footer-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 3rem;
    padding: 4rem 2rem 3rem;
}

/* ── Brand ── */
.footer-brand .logo {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 1.2rem;
}

.logo-icon {
    font-size: 1.8rem;
    color: var(--gold-color, #c5a13e);
}

.logo-text {
    font-family: var(--font-display, 'Outfit', serif);
    font-size: 1.35rem;
    font-weight: 600;
    color: #fff;
    letter-spacing: 0.02em;
}

.brand-desc {
    font-size: 0.88rem;
    line-height: 1.7;
    opacity: 0.7;
    margin-bottom: 1.4rem;
}

/* ── Social Links ── */
.social-links {
    display: flex;
    gap: 0.6rem;
}

.social-link {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.7);
    font-size: 1.2rem;
    text-decoration: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.social-link:hover {
    background: var(--gold-color, #c5a13e);
    border-color: var(--gold-color, #c5a13e);
    color: #fff;
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(197, 161, 62, 0.3);
}

/* ── Section Titles ── */
.section-title {
    color: #fff;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    margin-bottom: 1.4rem;
    position: relative;
    padding-bottom: 0.7rem;
}

.section-title::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 24px;
    height: 2px;
    background: var(--gold-color, #c5a13e);
    border-radius: 1px;
}

/* ── Contact List ── */
.contact-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.contact-list li {
    display: flex;
    align-items: flex-start;
    gap: 0.7rem;
    margin-bottom: 1rem;
    font-size: 0.88rem;
    line-height: 1.5;
}

.contact-icon {
    font-size: 1.15rem;
    color: var(--gold-color, #c5a13e);
    flex-shrink: 0;
    margin-top: 0.1rem;
}

.contact-list a {
    color: inherit;
    text-decoration: none;
    transition: color 0.25s ease;
}

.contact-list a:hover {
    color: var(--gold-color, #c5a13e);
}

/* ── Quick Links ── */
.quick-links {
    list-style: none;
    padding: 0;
    margin: 0;
}

.quick-links li {
    margin-bottom: 0.7rem;
}

.quick-links a {
    color: rgba(255, 255, 255, 0.65);
    text-decoration: none;
    font-size: 0.88rem;
    transition: all 0.25s ease;
    position: relative;
    padding-left: 0;
}

.quick-links a::before {
    content: '';
    display: inline-block;
    width: 0;
    height: 1px;
    background: var(--gold-color, #c5a13e);
    vertical-align: middle;
    margin-right: 0;
    transition: all 0.25s ease;
}

.quick-links a:hover {
    color: #fff;
    padding-left: 14px;
}

.quick-links a:hover::before {
    width: 8px;
    margin-right: 6px;
}

/* ── Language Select ── */
.lang-select-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.lang-icon {
    position: absolute;
    left: 12px;
    font-size: 1.1rem;
    color: var(--gold-color, #c5a13e);
    pointer-events: none;
    z-index: 1;
}

.lang-chevron {
    position: absolute;
    right: 12px;
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.5);
    pointer-events: none;
    z-index: 1;
}

.lang-select {
    width: 100%;
    appearance: none;
    -webkit-appearance: none;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    color: #fff;
    padding: 10px 36px 10px 38px;
    font-family: var(--font-primary, 'Outfit', sans-serif);
    font-size: 0.88rem;
    cursor: pointer;
    transition: all 0.3s ease;
    outline: none;
}

.lang-select:hover {
    border-color: rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.09);
}

.lang-select:focus {
    border-color: var(--gold-color, #c5a13e);
    box-shadow: 0 0 0 3px rgba(197, 161, 62, 0.15);
}

.lang-select option {
    background: #1a2e31;
    color: #fff;
    padding: 8px;
}

/* ── Bottom Bar ── */
.footer-bottom {
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    padding: 1.5rem 2rem;
    text-align: center;
    font-size: 0.8rem;
    opacity: 0.5;
}

/* ── Responsive ── */
@media (max-width: 1024px) {
    .footer-grid {
        grid-template-columns: 1fr 1fr;
        gap: 2.5rem;
    }
}

@media (max-width: 640px) {
    .footer-grid {
        grid-template-columns: 1fr;
        gap: 2rem;
        padding: 2rem 1rem 1rem;
    }

    .footer-brand .logo {
        justify-content: center;
    }

    .brand-desc {
        text-align: center;
    }

    .social-links {
        justify-content: center;
    }

    .section-title::after {
        left: 50%;
        transform: translateX(-50%);
    }

    .footer-section {
        text-align: center;
        margin: 0 auto;
    }

    .contact-list li {
        justify-content: center;
    }

    .quick-links a:hover {
        padding-left: 0;
    }

    .quick-links a::before {
        display: none;
    }
}
</style>
