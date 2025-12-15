<template>
    <div class="ww-rich-text-temp">
        <div
            v-if="hasContent"
            class="ww-rich-text-temp"
            :style="richTextStyle"
            ww-responsive="richtext"
            v-html="html"
        ></div>
    </div>
</template>

<script>
import { marked } from 'marked';
import mediumZoom from 'medium-zoom';

export default {
    props: {
        content: { type: Object, required: true },
    },
    data() {
        return {
            figures: [],
            isZoomed: false,
            zoomInstance: null,
        };
    },
    computed: {
        isEditing() {
            // eslint-disable-next-line no-unreachable
            return false;
        },
        html() {
            return marked.parse(wwLib.wwLang.getText(this.content.text));
        },
        hasContent() {
            const text = wwLib.wwLang.getText(this.content.text);
            return text && text.length;
        },
        richTextStyle() {
            return {
                // H1
                '--h1-fontSize': this.content.h1.fontSize,
                '--h1-fontFamily': this.content.h1.fontFamily,
                '--h1-fontWeight': this.content.h1.fontWeight,
                '--h1-textAlign': this.content.h1.textAlign,
                '--h1-color': this.content.h1.color,
                '--h1-lineHeight': this.content.h1.lineHeight,
                '--h1-margin-top': this.content.h1.marginTop,
                '--h1-margin-bottom': this.content.h1.marginBottom,
                // H2
                '--h2-fontSize': this.content.h2.fontSize,
                '--h2-fontFamily': this.content.h2.fontFamily,
                '--h2-fontWeight': this.content.h2.fontWeight,
                '--h2-textAlign': this.content.h2.textAlign,
                '--h2-color': this.content.h2.color,
                '--h2-lineHeight': this.content.h2.lineHeight,
                '--h2-margin-top': this.content.h2.marginTop,
                '--h2-margin-bottom': this.content.h2.marginBottom,
                // H3
                '--h3-fontSize': this.content.h3.fontSize,
                '--h3-fontFamily': this.content.h3.fontFamily,
                '--h3-fontWeight': this.content.h3.fontWeight,
                '--h3-textAlign': this.content.h3.textAlign,
                '--h3-color': this.content.h3.color,
                '--h3-lineHeight': this.content.h3.lineHeight,
                '--h3-margin-top': this.content.h3.marginTop,
                '--h3-margin-bottom': this.content.h3.marginBottom,
                // H4
                '--h4-fontSize': this.content.h4.fontSize,
                '--h4-fontFamily': this.content.h4.fontFamily,
                '--h4-fontWeight': this.content.h4.fontWeight,
                '--h4-textAlign': this.content.h4.textAlign,
                '--h4-color': this.content.h4.color,
                '--h4-lineHeight': this.content.h4.lineHeight,
                '--h4-margin-top': this.content.h4.marginTop,
                '--h4-margin-bottom': this.content.h4.marginBottom,
                // p
                '--p-fontSize': this.content.p.fontSize,
                '--p-fontFamily': this.content.p.fontFamily,
                '--p-fontWeight': this.content.p.fontWeight,
                '--p-textAlign': this.content.p.textAlign,
                '--p-color': this.content.p.color,
                '--p-lineHeight': this.content.p.lineHeight,
                '--p-margin-top': this.content.p.marginTop,
                '--p-margin-bottom': this.content.p.marginBottom,
                // a
                '--a-fontSize': this.content.a.fontSize,
                '--a-fontFamily': this.content.a.fontFamily,
                '--a-fontWeight': this.content.a.fontWeight,
                '--a-textAlign': this.content.a.textAlign,
                '--a-color': this.content.a.color,
                '--a-lineHeight': this.content.a.lineHeight,
                '--a-underline': this.content.a.isUnderline ? 'underline' : 'none',
                // blockquote
                '--blockquote-color': this.content.blockquote.color,
                '--blockquote-borderColor': this.content.blockquote.borderColor,
                '--blockquote-margin-top': this.content.blockquote.marginTop,
                '--blockquote-margin-bottom': this.content.blockquote.marginBottom,
                // images
                '--img-width': this.content.img.width,
                '--img-margin-top': this.content.img.marginTop,
                '--img-margin-bottom': this.content.img.marginBottom,
                // iframe
                '--iframe-width': this.content.iframe.width,
                '--iframe-height': this.content.iframe.height,
                '--iframe-margin-top': this.content.iframe.marginTop,
                '--iframe-margin-bottom': this.content.iframe.marginBottom,
            };
        },
    },
    watch: {
        'content.text'() {
            this.init();
        },
        'content.zoomEffect'() {
            if (!this.content.zoomEffect) {
                if (this.zoomInstance) this.zoomInstance.detach();
                this.zoomInstance = null;
            }
        },
        'content.zoomBackgroundColor'() {
            if (this.zoomInstance) this.zoomInstance.detach();
            const margin = parseInt(this.content.zoomMargin.slice(0, -2));
            const background = this.content.zoomBackgroundColor;
            this.zoomInstance = mediumZoom('[img-zoomable]', {
                margin,
                background,
            });
        },
        'content.zoomMargin'() {
            if (this.zoomInstance) this.zoomInstance.detach();
            const margin = parseInt(this.content.zoomMargin.slice(0, -2));
            const background = this.content.zoomBackgroundColor;
            this.zoomInstance = mediumZoom('[img-zoomable]', {
                margin,
                background,
            });
        },
    },
    mounted() {
        if (this.content.zoomEffect) {
            this.init();
        }
    },
    methods: {
        init() {
            if (!this.content.zoomEffect) return;

            this.figures = this.$el.querySelectorAll('img');

            for (let figure of this.figures) {
                figure.setAttribute('img-zoomable', '');
            }

            if (this.zoomInstance) this.zoomInstance.detach();
            this.zoomInstance = mediumZoom('[img-zoomable]', {
                margin: parseInt(this.content.zoomMargin.slice(0, -2)),
                background: this.content.zoomBackgroundColor,
            });
        },
    },
};
</script>

<style lang="scss" scoped>
.ww-rich-text-temp {
}
</style>

<style lang="scss">
.ww-rich-text-temp {
    h1 {
        font-size: var(--h1-fontSize);
        font-family: var(--h1-fontFamily);
        font-weight: var(--h1-fontWeight);
        text-align: var(--h1-textAlign);
        color: var(--h1-color);
        line-height: var(--h1-lineHeight);
        margin-top: var(--h1-margin-top);
        margin-bottom: var(--h1-margin-bottom);
    }
    h2 {
        font-size: var(--h2-fontSize);
        font-family: var(--h2-fontFamily);
        font-weight: var(--h2-fontWeight);
        text-align: var(--h2-textAlign);
        color: var(--h2-color);
        line-height: var(--h2-lineHeight);
        margin-top: var(--h2-margin-top);
        margin-bottom: var(--h2-margin-bottom);
    }
    h3 {
        font-size: var(--h3-fontSize);
        font-family: var(--h3-fontFamily);
        font-weight: var(--h3-fontWeight);
        text-align: var(--h3-textAlign);
        color: var(--h3-color);
        line-height: var(--h3-lineHeight);
        margin-top: var(--h3-margin-top);
        margin-bottom: var(--h3-margin-bottom);
    }
    h4 {
        font-size: var(--h4-fontSize);
        font-family: var(--h4-fontFamily);
        font-weight: var(--h4-fontWeight);
        text-align: var(--h4-textAlign);
        color: var(--h4-color);
        line-height: var(--h4-lineHeight);
        margin-top: var(--h4-margin-top);
        margin-bottom: var(--h4-margin-bottom);
    }
    p {
        font-size: var(--p-fontSize);
        font-family: var(--p-fontFamily);
        font-weight: var(--p-fontWeight);
        text-align: var(--p-textAlign);
        color: var(--p-color);
        line-height: var(--p-lineHeight);
        margin-top: var(--p-margin-top);
        margin-bottom: var(--p-margin-bottom);
    }
    a {
        display: initial;
        text-decoration: var(--a-underline);
        font-size: var(--a-fontSize);
        font-family: var(--a-fontFamily);
        font-weight: var(--a-fontWeight);
        text-align: var(--a-textAlign);
        color: var(--a-color);
        line-height: var(--a-lineHeight);
    }
    font-size: var(--p-fontSize);
    font-family: var(--p-fontFamily);
    font-weight: var(--p-fontWeight);
    text-align: var(--p-textAlign);
    color: var(--p-color);

    table {
        margin: 64px 0 !important;
        width: 100% !important;
        display: table;
        border-collapse: collapse;
        box-sizing: border-box;
        text-indent: initial;
        border-spacing: 2px;

        thead > tr {
            background: #f7f7fa;

            th {
                color: #5a6482;
                font-family: Work Sans;
                font-style: normal;
                font-weight: 500;
                font-size: 15px;
                line-height: 18px;
                letter-spacing: -0.08px;
            }
        }
        td,
        th {
            text-align: left;
            padding: 1.25em 1rem !important;
        }
        tbody {
            border: 1px solid #d1cfd7;
            tr:nth-child(2n) {
                background: #f7f7fa;
            }
        }
    }
    blockquote {
        color: var(--blockquote-color);
        border-left: 0.2rem solid var(--blockquote-borderColor);
        margin: 1rem 0;
        padding: 0.25rem 0 0.25rem 1rem;
        margin-top: var(--blockquote-margin-top);
        margin-bottom: var(--blockquote-margin-bottom);
    }
    figure {
        margin: 0;
        text-align: center;
    }
    p > img {
        display: flex;
        justify-content: center;

        width: var(--img-width);
        height: auto;
        margin: 52px auto;
        max-width: 100%;
        margin-top: var(--img-margin-top);
        margin-bottom: var(--img-margin-bottom);
    }
    img {
        width: var(--img-width);
        height: auto;
        margin: 52px auto;
        max-width: 100%;
        margin-top: var(--img-margin-top);
        margin-bottom: var(--img-margin-bottom);
    }
    iframe {
        width: var(--iframe-width);
        height: var(--iframe-height);
        margin: 24px auto;
        margin-top: var(--iframe-margin-top);
        margin-bottom: var(--iframe-margin-bottom);
    }
}
</style>
