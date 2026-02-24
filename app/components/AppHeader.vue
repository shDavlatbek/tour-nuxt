<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalePath, useRoute, navigateTo, useSwitchLocalePath } from '#imports'

const { t, locale, locales } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const route = useRoute()

const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)

const handleScroll = () => {
    // Basic body scroll for non-home pages
    if (route.path !== localePath('/') && route.path !== '/') {
        isScrolled.value = window.scrollY > 50
    }
}

onMounted(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })

    // Listen to custom virtual scroll for home page
    window.addEventListener('app:scrollProgress', ((e: CustomEvent) => {
        if (route.path === localePath('/') || route.path === '/') {
            isScrolled.value = e.detail > 0.05
        }
    }) as EventListener)

    handleScroll()
})

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
})

const toggleMobileMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
    if (isMobileMenuOpen.value) {
        document.body.style.overflow = 'hidden'
    } else {
        document.body.style.overflow = ''
    }
}

const closeMobileMenu = () => {
    isMobileMenuOpen.value = false
    document.body.style.overflow = ''
}

const navLinks = [
    { name: 'header.home', target: 0.0 },
    { name: 'header.about', target: 1.0 },
    { name: 'header.villages', target: 2 },
]

const handleNavClick = async (target: number) => {
    closeMobileMenu()

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('app:zoomOut'))
    }

    if (route.path !== localePath('/') && route.path !== '/') {
        await navigateTo(localePath('/'))
        // Wait a tick for index.vue to mount and register listener
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('app:scrollTo', { detail: target }))
        }, 100)
    } else {
        // Already on home page
        window.dispatchEvent(new CustomEvent('app:scrollTo', { detail: target }))
    }
}

interface LocaleObject {
    code: string
    name: string
}

function onLocaleChange(event: Event) {
    const target = event.target as HTMLSelectElement
    const code = target.value
    const path = switchLocalePath(code as any)
    navigateTo(path)
}
</script>

<template>
    <header class="app-header" :class="{ 'app-header--scrolled': isScrolled }">
        <div class="header-container">
            <!-- Logo -->
            <NuxtLink :to="localePath('/')" class="logo" @click.prevent="handleNavClick(0.0)">
                <Icon name="mdi:compass-rose" class="logo-icon" />
                <span class="logo-text">Tourist Villages</span>
            </NuxtLink>

            <!-- Right Side content wrapper -->
            <div class="header-right">
                <!-- Desktop Nav -->
                <nav class="desktop-nav">
                    <ul class="nav-list">
                        <li v-for="link in navLinks" :key="link.name">
                            <a href="#" class="nav-link" @click.prevent="handleNavClick(link.target)">
                                {{ t(link.name, link.name.split('.')[1].charAt(0).toUpperCase() +
                                    link.name.split('.')[1].slice(1)) }}
                            </a>
                        </li>
                    </ul>
                </nav>

                <!-- Language Switcher (Desktop) -->
                <div class="lang-select-wrapper desktop-lang">
                    <Icon name="mdi:translate" class="lang-icon" />
                    <select :value="locale" class="lang-select" @change="onLocaleChange"
                        :aria-label="t('footer.language', 'Language')">
                        <option v-for="loc in (locales as LocaleObject[])" :key="loc.code" :value="loc.code">
                            {{ loc.code.toUpperCase() }}
                        </option>
                    </select>
                    <Icon name="mdi:chevron-down" class="lang-chevron" />
                </div>

                <!-- Mobile Menu Toggle Button -->
                <button v-show="!isMobileMenuOpen" class="mobile-menu-toggle" aria-label="Toggle menu"
                    @click="toggleMobileMenu">
                    <Icon name="mdi:menu" class="menu-icon" />
                </button>
            </div>
        </div>

        <!-- Mobile Nav Overlay -->
        <transition name="slide-down">
            <nav v-if="isMobileMenuOpen" class="mobile-nav">

                <button class="mobile-close-btn" aria-label="Close menu" @click="closeMobileMenu">
                    <Icon name="mdi:close" class="close-icon" />
                </button>

                <ul class="mobile-nav-list">
                    <li v-for="link in navLinks" :key="link.name">
                        <a href="#" class="mobile-nav-link" @click.prevent="handleNavClick(link.target)">
                            {{ t(link.name, link.name.split('.')[1].charAt(0).toUpperCase() +
                                link.name.split('.')[1].slice(1)) }}
                        </a>
                    </li>
                </ul>

                <!-- Language Switcher (Mobile) -->
                <div class="lang-select-wrapper mobile-lang">
                    <Icon name="mdi:translate" class="lang-icon" />
                    <select :value="locale" class="lang-select" @change="onLocaleChange"
                        :aria-label="t('footer.language', 'Language')">
                        <option v-for="loc in (locales as LocaleObject[])" :key="loc.code" :value="loc.code">
                            {{ loc.code.toUpperCase() }}
                        </option>
                    </select>
                    <Icon name="mdi:chevron-down" class="lang-chevron" />
                </div>
            </nav>
        </transition>
    </header>
</template>

<style scoped>
.app-header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    z-index: 1000;
    transition: all 0.3s ease;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 100%);
    padding: 20px 0;
}

.app-header--scrolled {
    /* background: rgba(26, 26, 26, 0.85); */
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
    padding: 12px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.header-container {
    max-width: 1440px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

/* ── Logo ── */
.logo {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    text-decoration: none;
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
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
}

/* ── Desktop Nav ── */
.desktop-nav {
    display: none;
}

@media (min-width: 768px) {
    .desktop-nav {
        display: block;
    }
}

.nav-list {
    display: flex;
    gap: 2rem;
    list-style: none;
    margin: 0;
    padding: 0;
}

.nav-link {
    color: rgba(255, 255, 255, 0.9);
    text-decoration: none;
    font-family: var(--font-primary, 'Outfit', sans-serif);
    font-size: 0.95rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    transition: color 0.3s ease;
    position: relative;
    padding-bottom: 4px;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

.nav-link::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background: var(--gold-color, #c5a13e);
    transition: width 0.3s ease;
}

.nav-link:hover {
    color: #fff;
}

.nav-link:hover::after {
    width: 100%;
}

/* ── Language Select ── */
.lang-select-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

@media (max-width: 767px) {
    .desktop-lang {
        display: none !important;
    }
}

.lang-icon {
    position: absolute;
    left: 10px;
    font-size: 1rem;
    color: var(--gold-color, #c5a13e);
    pointer-events: none;
    z-index: 1;
}

.lang-chevron {
    position: absolute;
    right: 8px;
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.8);
    pointer-events: none;
    z-index: 1;
}

.lang-select {
    width: auto;
    appearance: none;
    -webkit-appearance: none;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: #fff;
    padding: 6px 28px 6px 30px;
    font-family: var(--font-primary, 'Outfit', sans-serif);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    outline: none;
}

.lang-select:hover {
    border-color: rgba(255, 255, 255, 0.4);
    background: rgba(0, 0, 0, 0.5);
}

.lang-select:focus {
    border-color: var(--gold-color, #c5a13e);
}

.lang-select option {
    background: #1a2e31;
    color: #fff;
    padding: 8px;
}

/* ── Mobile Menu Toggle ── */
.mobile-menu-toggle {
    display: block;
    background: none;
    border: none;
    color: #fff;
    cursor: pointer;
    padding: 0;
    z-index: 1001;
    position: relative;
}

@media (min-width: 768px) {
    .mobile-menu-toggle {
        display: none;
    }
}

.menu-icon {
    font-size: 2rem;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

/* ── Mobile Nav Overlay ── */
.mobile-nav {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100dvh;
    background: rgba(26, 26, 26, 0.98);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 999;
}

.mobile-nav-list {
    list-style: none;
    padding: 0;
    margin: 0;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
}

.mobile-nav-link {
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    font-family: var(--font-display, 'Outfit', serif);
    font-size: 2rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    transition: color 0.3s ease;
}
.mobile-nav-link {
    color: rgba(255, 255, 255, 0.8);
}

.mobile-nav-link:hover {
    color: var(--gold-color, #c5a13e);
    text-decoration: none;
    font-family: var(--font-display, 'Outfit', serif);
    font-size: 2rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    transition: color 0.3s ease;
}

.mobile-nav-link:hover {
    color: var(--gold-color, #c5a13e);
}

.mobile-lang {
    margin-top: 2rem;
}

.mobile-lang .lang-select {
    font-size: 1.2rem;
    padding: 10px 40px 10px 45px;
    background: rgba(255, 255, 255, 0.05);
}

.mobile-lang .lang-icon {
    font-size: 1.5rem;
    left: 15px;
}

.mobile-lang .lang-chevron {
    font-size: 1.5rem;
    right: 12px;
}

.mobile-close-btn {
    position: absolute;
    top: 20px;
    right: 2rem;
    background: none;
    border: none;
    color: #fff;
    cursor: pointer;
    padding: 0;
    z-index: 1002;
    display: flex;
    align-items: center;
    justify-content: center;
}

.mobile-close-btn .close-icon {
    font-size: 2rem;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

/* Mobile Nav Transition */
.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-down-enter-from,
.slide-down-leave-to {
    opacity: 0;
    transform: translateY(-20px);
}
</style>
