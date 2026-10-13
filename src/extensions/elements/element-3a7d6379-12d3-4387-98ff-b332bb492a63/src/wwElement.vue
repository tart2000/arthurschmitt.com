<template>
    <component
        :is="linkTag"
        v-bind="properties"
        class="ww-image-basic"
        ww-responsive="ww-image-basic"
        :class="{ '-link': hasLink && !isEditing }"
    >
        <div class="ww-image-basic-overlay"></div>
        <img :src="src" :alt="alt" v-bind="{ loading: content.loading || 'lazy' }" />
    </component>
</template>

<script>
export default {
    props: {
        content: { type: Object, required: true },
        wwElementState: { type: Object, required: true },
    },
    emits: ['update:content'],
    setup() {
        const { hasLink, tag: linkTag, properties } = wwLib.wwElement.useLink();

        return {
            hasLink,
            linkTag,
            properties,
        };
    },
    computed: {
        /* URL */
        url() {
            const url = this.wwElementState.props.url || this.content.url || '';
            return typeof url === 'string' ? url : '';
        },
        isWeWeb() {
            return this.url.startsWith('designs/');
        },
        src() {
            return this.isWeWeb ? `${wwLib.wwUtils.getCdnPrefix()}${this.url}` : this.url;
        },

        isEditing() {
            // eslint-disable-next-line no-unreachable
            return false;
        },

        /* ALT */
        alt() {
            return wwLib.wwLang.getText(this.content.alt);
        },
    },
};
</script>

<style scoped lang="scss">
.ww-image-basic {
    position: relative;
    isolation: isolate;
    overflow: hidden;

    &.-link {
        cursor: pointer;
    }

    &-overlay {
        z-index: 1;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--wwi-o, transparent);
        pointer-events: none;
    }

    & img {
        z-index: 0;
        width: 100%;
        height: 100%;
        display: block;
        aspect-ratio: var(--wwi-ar, unset);
        object-fit: var(--wwi-of, fill);
        filter: var(--wwi-f, none);
        image-rendering: -webkit-optimize-contrast;
    }
}

</style>
