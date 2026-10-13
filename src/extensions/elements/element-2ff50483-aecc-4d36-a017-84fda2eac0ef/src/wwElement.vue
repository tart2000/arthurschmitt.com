<template>
    <component
        :is="hasLink ? tag : 'span'"
        class="pixicons-icon-root"
        :class="{ '-link': hasLink }"
        :style="rootStyle"
        :role="hasLink ? undefined : (hasA11yLabel ? 'img' : undefined)"
        :aria-label="hasA11yLabel ? a11yLabel : undefined"
        :aria-hidden="hasLink ? undefined : (hasA11yLabel ? undefined : 'true')"
        v-bind="properties"
    >
        <i ref="iconEl" :class="iClasses"></i>
    </component>
</template>

<script>
import { computed, onMounted, ref, watch } from 'vue';

const SCRIPT_URL = 'https://www.pixicons.io/kit/pixicons.js';
const SYNC_CLASS = 'pixicons-icon-sync';

export default {
    props: {
        uid: { type: String, required: false },
        content: { type: Object, required: true },
        wwElementState: { type: Object, required: false },
    },
    setup(props) {
        let hasLink = computed(() => false);
        let tag = computed(() => 'span');
        let properties = computed(() => ({}));

        try {
            if (typeof wwLib !== 'undefined' && wwLib.wwElement?.useLink) {
                const linkRes = wwLib.wwElement.useLink();
                if (linkRes) {
                    hasLink = linkRes.hasLink;
                    tag = linkRes.tag;
                    properties = linkRes.properties;
                }
            }
        } catch (e) {
            // Fallback safely if useLink is unavailable
        }

        const isEditing = computed(() => {
            // eslint-disable-next-line no-unreachable
            return false;
        });

        const iconEl = ref(null);

        const loadKitScript = () => {
            const doc = wwLib?.getFrontDocument?.() || (typeof document !== 'undefined' ? document : null);
            if (!doc) return;

            const existingScript = doc.querySelector(`script[src="${SCRIPT_URL}"]`);
            if (!existingScript) {
                const script = doc.createElement('script');
                script.src = SCRIPT_URL;
                script.async = true;
                (doc.head || doc.body || doc.documentElement).appendChild(script);
            }
        };

        // The Pixicons kit renders icons from a MutationObserver. In the WeWeb editor and preview,
        // the DOM is driven from another window, so the kit's `instanceof` checks fail on our nodes
        // and it ignores direct changes to the <i>. Toggling a class on the parent makes the kit
        // rescan its descendants with querySelectorAll, which works in every context.
        const refreshIcon = () => {
            const parent = iconEl.value?.parentElement;
            if (!parent) return;
            parent.classList.add(SYNC_CLASS);
            parent.classList.remove(SYNC_CLASS);
        };

        onMounted(() => {
            loadKitScript();
            refreshIcon();
        });

        const iconVal = computed(() => {
            return props.wwElementState?.props?.icon || props.content?.icon;
        });

        const styleVal = computed(() => {
            return props.wwElementState?.props?.style || props.content?.style;
        });

        const variantVal = computed(() => {
            return props.wwElementState?.props?.variant || props.content?.variant;
        });

        const sizeVal = computed(() => {
            return props.wwElementState?.props?.size || props.content?.size;
        });

        const colorVal = computed(() => {
            return props.wwElementState?.props?.color || props.content?.color;
        });

        const iClasses = computed(() => {
            const classes = ['px'];

            const rawIcon = iconVal.value;
            const iconName = typeof rawIcon === 'string' ? rawIcon.trim().toLowerCase() : '';
            if (iconName) {
                classes.push(`px-${iconName}`);
            }

            const rawStyle = styleVal.value;
            const styleName = typeof rawStyle === 'string' ? rawStyle.trim().toLowerCase() : 'pixel';
            if (styleName) {
                classes.push(`px-${styleName}`);
            }

            const rawVariant = variantVal.value;
            const variantName = typeof rawVariant === 'string' ? rawVariant.trim().toLowerCase() : 'regular';
            if (variantName) {
                classes.push(`px-${variantName}`);
            }

            return classes.join(' ');
        });

        // Same <i> element is kept across state changes: only its classes change, then the kit is nudged.
        watch(iClasses, () => refreshIcon(), { flush: 'post' });

        const a11yLabel = computed(() => {
            const raw = props.content?.accessibleLabel;
            return typeof raw === 'string' ? raw.trim() : '';
        });

        const hasA11yLabel = computed(() => !!a11yLabel.value);

        const rootStyle = computed(() => {
            const style = {
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
            };

            if (sizeVal.value) {
                style.fontSize = sizeVal.value;
            }

            if (colorVal.value) {
                style.color = colorVal.value;
            }

            return style;
        });

        return {
            isEditing,
            hasLink,
            tag,
            properties,
            iconEl,
            iClasses,
            a11yLabel,
            hasA11yLabel,
            rootStyle,
        };
    },
};
</script>

<style scoped>
.pixicons-icon-root {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
}

.pixicons-icon-root.-link {
    cursor: pointer;
    text-decoration: none;
    color: inherit;
}
</style>
