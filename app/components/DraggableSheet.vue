<template>
    <div class="ds-backdrop" :class="{ visible: isVisible }" @click="onBackdropClick"></div>

    <div v-if="props.floatingHandle" ref="handle" class="ds-handle floating"
        :class="{ hidden: !animating && !isVisible }" :style="handleStyle"
        @pointerdown.prevent.stop="onHandlePointerDown" @touchstart.prevent.stop="onHandleTouchStart"
        aria-hidden="true">
        <div class="ds-handle-bar"></div>
    </div>

    <div ref="sheet" class="ds-sheet" :class="{
        'ds-auto': isAuto,
        'floating-handle': props.floatingHandle,
        'hidden': !animating && !isVisible
    }" :style="sheetStyle" role="dialog" aria-modal="true" tabindex="-1">
        <div v-if="!props.floatingHandle" ref="handle" class="ds-handle" @pointerdown.prevent.stop="onHandlePointerDown"
            @touchstart.prevent.stop="onHandleTouchStart" aria-hidden="true">
            <div class="ds-handle-bar"></div>
        </div>

        <div v-if="props.showCloseButton" class="ds-close-button" @click="close" aria-label="Close" role="button">
            <i class="ti ti-x"></i>
        </div>

        <div ref="content" class="ds-content">
            <slot />
        </div>
        <div ref="bottom" v-if="$slots.bottom" class="ds-bottom">
            <slot name="bottom"></slot>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
    modelValue: { type: Boolean, default: false },
    snapPoints: { type: [Array, String], default: () => [0, 0.5, 1] },
    initial: { type: Number, default: null },
    closeOnBackdrop: { type: Boolean, default: true },
    minSnapToOpenIndex: { type: Number, default: 1 },
    pullToCloseFraction: { type: Number, default: 0.6 },
    pullToCloseThreshold: { type: Number, default: 120 },
    dragStartTolerance: { type: Number, default: 4 },
    showCloseButton: { type: Boolean, default: true },
    floatingHandle: { type: Boolean, default: true },
});
const emit = defineEmits(['update:modelValue', 'snap']);

const sheet = ref(null);
const handle = ref(null);
const content = ref(null);
const bottom = ref(null);

const isDragging = ref(false);
const dragFromHandle = ref(false);
const startY = ref(0);
const startFrac = ref(0);
const currentFrac = ref(0);
const animating = ref(false);
const isAuto = ref(false);
const sheetHeight = ref(0);

const snaps = computed(() => {
    if (typeof props.snapPoints === 'string' && props.snapPoints.toLowerCase() === 'auto') {
        isAuto.value = true;
        return [0, 1];
    } else {
        isAuto.value = false;
        const arr = Array.from(new Set((props.snapPoints || []).map(n => Math.min(1, Math.max(0, Number(n) || 0)))));
        arr.sort((a, b) => a - b);
        return arr.length ? arr : [0, 0.5, 1];
    }
});

const isVisible = computed(() => currentFrac.value > 0.001);
const sheetStyle = computed(() => {
    const ty = (1 - currentFrac.value) * 100;
    return {
        transform: `translateY(${ty}%)`,
        transition: animating.value ? 'transform 220ms cubic-bezier(.22,.9,.27,1)' : 'none',
    };
});
const handleStyle = computed(() => {
    if (!props.floatingHandle) return {};
    if (!isVisible.value) return {};
    const bottom = currentFrac.value * sheetHeight.value;
    return {
        bottom: `${bottom}px`,
        transition: animating.value ? 'bottom 220ms cubic-bezier(.22,.9,.27,1)' : 'none',
    };
});

function clamp(a, b, x) {
    return Math.max(a, Math.min(b, x));
}
function findNearest(arr, v) {
    let best = arr[0],
        bestD = Math.abs(arr[0] - v);
    for (const a of arr) {
        const d = Math.abs(a - v);
        if (d < bestD) {
            best = a;
            bestD = d;
        }
    }
    return best;
}

// Update sheet height
function updateSheetHeight() {
    if (sheet.value) {
        sheetHeight.value = sheet.value.clientHeight;
    }
}

// ResizeObserver to track sheet size changes
let resizeObserver = null;

// Body scroll lock
let prevBodyOverflow = '';
let savedScrollY = 0;
function lockBodyScroll() {
    savedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    prevBodyOverflow = document.body.style.overflow;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.overflow = 'hidden';
}
function unlockBodyScroll() {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.overflow = prevBodyOverflow || '';
    window.scrollTo(0, savedScrollY || 0);
}

onMounted(() => {
    setFracForModelValue(props.modelValue);
    window.addEventListener('resize', onWindowResize);

    // Initial height measurement
    updateSheetHeight();

    // Setup ResizeObserver to track content changes
    if (sheet.value && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
            updateSheetHeight();
        });
        resizeObserver.observe(sheet.value);
    }

    if (content.value) {
        content.value.addEventListener('pointerdown', contentPointerDownHandler, { passive: false });
        content.value.addEventListener('touchstart', contentTouchStartHandler, { passive: false });
    }
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', onWindowResize);
    unlockBodyScroll();

    // Disconnect ResizeObserver
    if (resizeObserver) {
        resizeObserver.disconnect();
        resizeObserver = null;
    }

    if (content.value) {
        content.value.removeEventListener('pointerdown', contentPointerDownHandler);
        content.value.removeEventListener('touchstart', contentTouchStartHandler);
    }
    cleanupMoveListeners();
});

watch(isVisible, (v) => {
    if (v) {
        lockBodyScroll();
        setTimeout(updateSheetHeight, 0);
    } else {
        unlockBodyScroll();
    }
});

watch(() => props.modelValue, (v) => setOpenFromModel(v));

function setFracForModelValue(val) {
    if (props.initial !== null) {
        currentFrac.value = clamp(0, 1, props.initial);
        return;
    }
    currentFrac.value = val ? snaps.value[snaps.value.length - 1] : snaps.value[0];
}
function setOpenFromModel(v) {
    animating.value = true;
    currentFrac.value = v ? snaps.value[snaps.value.length - 1] : snaps.value[0];
    setTimeout(() => {
        animating.value = false;
        updateSheetHeight();
    }, 260);
}
function onWindowResize() {
    currentFrac.value = clamp(0, 1, currentFrac.value);
    updateSheetHeight();
}
function onBackdropClick() {
    if (!props.closeOnBackdrop) return;
    close();
}

function getClientY(ev) {
    if (!ev) return 0;
    if (ev.type && ev.type.startsWith('touch')) {
        if (ev.touches && ev.touches[0]) return ev.touches[0].clientY;
        if (ev.changedTouches && ev.changedTouches[0]) return ev.changedTouches[0].clientY;
    }
    return ev.clientY !== undefined ? ev.clientY : ev.pageY || 0;
}

// --- Content handlers ---
let moveListenerRefs = [];
let contentStartScrollTop = 0;
let contentDragStarted = false;

function contentPointerDownHandler(ev) {
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    setupContentDragBase(getClientY(ev));

    const onMove = (e) => handleContentMove(e);
    const onUp = (e) => {
        cleanupMoveListeners();
        if (contentDragStarted) onPointerUp(e);
    };
    content.value.addEventListener('pointermove', onMove, { passive: false });
    content.value.addEventListener('pointerup', onUp);
    content.value.addEventListener('pointercancel', onUp);
    moveListenerRefs.push({ el: content.value, type: 'pointermove', fn: onMove });
    moveListenerRefs.push({ el: content.value, type: 'pointerup', fn: onUp });
    moveListenerRefs.push({ el: content.value, type: 'pointercancel', fn: onUp });
}

function contentTouchStartHandler(ev) {
    setupContentDragBase(getClientY(ev));
    const onMove = (e) => handleContentMove(e);
    const onUp = (e) => {
        cleanupMoveListeners();
        if (contentDragStarted) onPointerUp(e);
    };
    content.value.addEventListener('touchmove', onMove, { passive: false });
    content.value.addEventListener('touchend', onUp);
    content.value.addEventListener('touchcancel', onUp);
    moveListenerRefs.push({ el: content.value, type: 'touchmove', fn: onMove });
    moveListenerRefs.push({ el: content.value, type: 'touchend', fn: onUp });
    moveListenerRefs.push({ el: content.value, type: 'touchcancel', fn: onUp });
}

function setupContentDragBase(clientY) {
    dragFromHandle.value = false;
    contentDragStarted = false;
    contentStartScrollTop = content.value ? content.value.scrollTop : 0;
    startY.value = clientY;
    startFrac.value = currentFrac.value;
}

function cleanupMoveListeners() {
    for (const r of moveListenerRefs) {
        try {
            r.el && r.el.removeEventListener(r.type, r.fn);
        } catch { }
    }
    moveListenerRefs = [];
}

function handleContentMove(ev) {
    if (!content.value) return;
    const c = content.value;
    const clientY = getClientY(ev);
    const dy = clientY - startY.value;
    const dragTol = Number(props.dragStartTolerance) || 4;

    if (c.scrollHeight > c.clientHeight && dy < 0 && c.scrollTop > 0) {
        return;
    }

    if (c.scrollTop <= 0 && dy > 0) {
        if (ev && typeof ev.preventDefault === 'function' && ev.cancelable) ev.preventDefault();

        if (!contentDragStarted && Math.abs(dy) > dragTol) {
            contentDragStarted = true;
            beginDrag(ev, { fromContent: true });
        } else if (contentDragStarted) {
            onPointerMove(ev);
        }
    }
}

// --- Handle/drag logic ---
function onHandlePointerDown(ev) {
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    dragFromHandle.value = true;
    beginDrag(ev, { fromHandle: true });
}
function onHandleTouchStart(ev) {
    dragFromHandle.value = true;
    beginDrag(ev, { fromHandle: true });
}

function beginDrag(ev, opts = {}) {
    if (!sheet.value) return;
    isDragging.value = true;
    const fromContent = !!opts.fromContent;

    if (!fromContent) {
        dragFromHandle.value = opts.fromHandle || dragFromHandle.value;
        startY.value = getClientY(ev);
        startFrac.value = currentFrac.value;
    }

    if (ev.pointerId && sheet.value.setPointerCapture) {
        sheet.value.setPointerCapture(ev.pointerId);
    }

    content.value && (content.value.style.pointerEvents = 'none');

    if (fromContent) {
        if (ev.pointerId && content.value.releasePointerCapture) {
            try {
                content.value.releasePointerCapture(ev.pointerId);
            } catch { }
        }
        cleanupMoveListeners();
    }

    const onMove = (e) => onPointerMove(e);
    const onUp = (e) => {
        onPointerUp(e);
        cleanupMoveListeners();
    };
    sheet.value.addEventListener('pointermove', onMove, { passive: false });
    sheet.value.addEventListener('pointerup', onUp);
    sheet.value.addEventListener('pointercancel', onUp);
    moveListenerRefs.push({ el: sheet.value, type: 'pointermove', fn: onMove });
    moveListenerRefs.push({ el: sheet.value, type: 'pointerup', fn: onUp });
    moveListenerRefs.push({ el: sheet.value, type: 'pointercancel', fn: onUp });

    const touchMove = (e) => onPointerMove(e);
    const touchUp = (e) => onPointerUp(e);
    sheet.value.addEventListener('touchmove', touchMove, { passive: false });
    sheet.value.addEventListener('touchend', touchUp);
    sheet.value.addEventListener('touchcancel', touchUp);
    moveListenerRefs.push({ el: sheet.value, type: 'touchmove', fn: touchMove });
    moveListenerRefs.push({ el: sheet.value, type: 'touchend', fn: touchUp });
    moveListenerRefs.push({ el: sheet.value, type: 'touchcancel', fn: touchUp });
}

function onPointerMove(ev) {
    if (!isDragging.value) return;
    if (ev && typeof ev.preventDefault === 'function' && ev.cancelable) ev.preventDefault();
    const clientY = getClientY(ev);
    const dy = clientY - startY.value;
    const denom = sheetHeight.value || window.innerHeight;
    const deltaFrac = -dy / denom;
    currentFrac.value = clamp(0, 1, startFrac.value + deltaFrac);
}

function onPointerUp(ev) {
    if (!isDragging.value) return;
    isDragging.value = false;
    contentDragStarted = false;
    animating.value = true;
    content.value && (content.value.style.pointerEvents = '');

    if (ev.pointerId && sheet.value.releasePointerCapture) {
        try {
            sheet.value.releasePointerCapture(ev.pointerId);
        } catch { }
    }

    const clientY = getClientY(ev);
    const pulledFraction = Math.max(0, startFrac.value - currentFrac.value);
    const pulledPx =
        clientY && startY.value
            ? clientY - startY.value
            : pulledFraction * (window.innerHeight || document.documentElement.clientHeight);
    const fractionClose = pulledFraction >= Number(props.pullToCloseFraction || 0.6);
    const pxClose = pulledPx >= Number(props.pullToCloseThreshold || 120);
    const fracBelow = currentFrac.value <= snaps.value[0] + 0.05;

    cleanupMoveListeners();

    if (fractionClose || pxClose || fracBelow) {
        currentFrac.value = snaps.value[0];
        emit('update:modelValue', false);
        setTimeout(() => (animating.value = false), 240);
        return;
    }

    const nearest = findNearest(snaps.value, currentFrac.value);
    currentFrac.value = nearest;
    emit('snap', nearest);
    const isOpen = snaps.value.indexOf(nearest) >= props.minSnapToOpenIndex;
    emit('update:modelValue', isOpen);
    setTimeout(() => (animating.value = false), 240);
}

// API
function close() {
    animating.value = true;
    currentFrac.value = snaps.value[0];
    emit('update:modelValue', false);
    setTimeout(() => (animating.value = false), 240);
}
function open() {
    animating.value = true;
    currentFrac.value = snaps.value[snaps.value.length - 1];
    emit('update:modelValue', true);
    setTimeout(() => {
        animating.value = false;
        updateSheetHeight();
    }, 240);
}
defineExpose({ open, close });
</script>

<style scoped>
.ds-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0);
    transition: background 220ms ease;
    pointer-events: none;
    z-index: 40;
}

.ds-backdrop.visible {
    background: rgba(0, 0, 0, 0.35);
    pointer-events: auto;
}

.ds-sheet {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    height: 90vh;
    max-height: 95vh;
    background: white;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.12);
    z-index: 50;
    touch-action: pan-y;
    display: flex;
    flex-direction: column;
    will-change: transform;
    overscroll-behavior: contain;
    opacity: 1;
    transition: opacity 220ms ease;
}

.ds-sheet.hidden {
    opacity: 0;
    pointer-events: none;
}

.ds-content::-webkit-scrollbar {
    width: 0px;
    display: none;
}

.ds-sheet.ds-auto {
    height: auto;
    max-height: 90vh;
}

.ds-sheet.ds-auto .ds-content {
    flex: 0 1 auto;
    max-height: none;
}

.ds-handle {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px 0 8px 0;
    cursor: grab;
    user-select: none;
    z-index: 51;
    touch-action: none;
}

.ds-handle:active {
    cursor: grabbing;
}

.ds-handle-bar {
    width: 36px;
    height: 4px;
    background: #cfcfcf;
    border-radius: 99px;
}

.ds-handle.floating {
    position: fixed;
    left: 0;
    right: 0;
    z-index: 51;
    background: transparent;
    opacity: 1;
    transition: opacity 220ms ease;
}

.ds-handle.floating.hidden {
    opacity: 0;
    pointer-events: none;
}

.ds-content {
    overflow: auto;
    flex: 1 1 auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
    touch-action: pan-y;
}

.ds-bottom {
    flex: 0 0 auto;
    background: white;
    border-top: 1px solid #eee;
    z-index: 1;
}

.ds-close-button {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 24px;
    height: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 18px;
    cursor: pointer;
    z-index: 52;
    border-radius: 50%;
    background: rgb(187, 187, 187);
}

.ds-close-button i {
    color: #353535;
}

.ds-sheet,
.ds-content,
.ds-handle,
.ds-bottom {
    -webkit-user-select: none;
    -ms-user-select: none;
    user-select: none;
}
</style>