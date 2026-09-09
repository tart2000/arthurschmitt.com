<template>
    <div class="ww-input-basic" :class="[componentClasses.root, { editing: isEditing }]" v-bind="rootBinding">
        <input
            :id="$attrs.id"
            v-if="content.type !== 'textarea'"
            :key="'ww-input-basic-' + step"
            ref="input"
            v-bind="inputBinding"
            :value="value"
            class="ww-input-basic__input"
            :class="[
                {
                    hideArrows: content.hideArrows && inputType === 'number',
                    'date-placeholder': content.type === 'date' && !value,
                    '-readonly': isReadonly,
                },
                componentClasses.input,
            ]"
            :type="inputType"
            :name="wwElementState.name"
            :readonly="isReadonly"
            :required="content.required"
            :autocomplete="content.autocomplete ? 'on' : 'off'"
            :placeholder="isAdvancedPlaceholder ? '' : wwLang.getText(content.placeholder)"
            :style="style"
            :min="min"
            :max="max"
            :step="stepAttribute"
            @input="handleManualInput($event)"
            @blur="onBlur($event)"
            @focus="isReallyFocused = true"
        />
        <textarea
            v-else
            ref="input"
            :id="$attrs.id"
            v-bind="inputBinding"
            :value="value"
            class="ww-input-basic__input"
            :class="componentClasses.input"
            :type="content.type"
            :name="wwElementState.name"
            :readonly="isReadonly"
            :required="content.required"
            :placeholder="isAdvancedPlaceholder ? '' : wwLang.getText(content.placeholder)"
            :style="[style, { resize: content.resize ? '' : 'none' }]"
            :rows="content.rows"
            @input="handleManualInput($event)"
            @focus="isReallyFocused = true"
            @blur="isReallyFocused = false"
        />
        <div
            v-if="isAdvancedPlaceholder"
            ref="placeholder"
            class="ww-input-basic__placeholder"
            :style="placeholderSyle"
            @click="focusInput"
        >
            <wwElement
                v-bind="content.placeholderElement"
                :states="value === 0 || (value && value.length) ? ['active'] : []"
                :ww-props="{ text: wwLang.getText(content.placeholder) }"
            ></wwElement>
        </div>
    </div>
</template>

<script>
import { computed, ref, inject } from 'vue';

const INPUT_STYLE_PROPERTIES = [
    'padding',
    'border',
    'borderLeft',
    'borderRight',
    'borderTop',
    'borderBottom',
    'borderRadius',
    'background',
    'boxShadow',
    'cursor',
];

const ELEMENT_ROOT_CLASS_PREFIXES = ['ww-element-', 'ww-e-', 'ww-a-'];

function normalizeClasses(value) {
    if (typeof value === 'string') return value.split(/\s+/).filter(Boolean);
    if (Array.isArray(value)) return value.flatMap(normalizeClasses);
    if (!value || typeof value !== 'object') return [];

    const classes = [];
    for (const className in value) {
        if (Object.hasOwn(value, className) && value[className]) classes.push(className);
    }
    return classes;
}

function isElementRootClass(className) {
    return (
        className === 'ww-element' ||
        ELEMENT_ROOT_CLASS_PREFIXES.some(prefix => className.startsWith(prefix)) ||
        /^ww-(?:flexbox|grid|layout)__object$/.test(className)
    );
}

export default {
    inheritAttrs: false,
    props: {
        content: { type: Object, required: true },
        uid: { type: String, required: true },
        wwElementState: { type: Object, required: true },
    },
    emits: ['trigger-event', 'update:content:effect'],
    setup(props) {
        const type = computed(() => {
            if (Object.keys(props.wwElementState.props).includes('type')) {
                return props.wwElementState.props.type;
            }

            return props.content.type;
        });
        const step = computed(() => {
            if (['decimal', 'number'].includes(type.value)) return props.content.step;
            if ('time' === type.value) return props.content.timePrecision || 1;
            return 1;
        });
        function formatValue(value) {
            if (type.value !== 'decimal') return value;
            if (!value && value !== 0) return '';
            value = `${value}`.replace(',', '.');
            const length = value.indexOf('.') !== -1 ? props.content.precision.split('.')[1].length : 0;
            const newValue = parseFloat(Number(value).toFixed(length).replace(',', '.'));
            return newValue;
        }

        const { value: variableValue, setValue } = wwLib.wwVariable.useComponentVariable({
            uid: props.uid,
            name: 'value',
            type: computed(() => (['decimal', 'number'].includes(type.value) ? 'number' : 'string')),
            defaultValue: computed(() => (props.content.value === undefined ? '' : formatValue(props.content.value))),
        });

        const inputRef = ref('input');

        const state = inject('componentState', {});


        return {
            variableValue,
            setValue,
            formatValue,
            step,
            type,
            inputRef,
            state,
        };
    },
    data() {
        return {
            paddingLeft: '0px',
            placeholderPosition: {
                top: '0px',
                left: '0px',
            },
            isReallyFocused: false,
            noTransition: false,
            isMounted: false,
            isDebouncing: false,
        };
    },
    computed: {
        isEditing() {
            // eslint-disable-next-line no-unreachable
            return false;
        },
        value() {
            return this.variableValue;
        },
        delay() {
            return wwLib.wwUtils.getLengthUnit(this.content.debounceDelay)[0];
        },
        componentClasses() {
            const classes = { root: [], input: [] };
            for (const className of normalizeClasses(this.$attrs.class)) {
                classes[isElementRootClass(className) ? 'root' : 'input'].push(className);
            }
            return classes;
        },
        placeholderSyle() {
            const transition = `all ${this.noTransition ? '0ms' : this.content.transition} ${
                this.content.timingFunction
            }`;

            const animatedPosition =
                this.content.placeholderPosition === 'outside'
                    ? {
                          top: '-' + this.content.positioningAjustment,
                          left: this.placeholderPosition.left,
                          transform: `translate3d(0, -100%, 0) scale(${this.content.placeholderScaling})`,
                          transformOrigin: 'left',
                          transition,
                      }
                    : {
                          top: this.content.positioningAjustment,
                          left: this.placeholderPosition.left,
                          transform: `translate3d(0, 0%, 0) scale(${this.content.placeholderScaling})`,
                          transformOrigin: 'left',
                          transition,
                      };

            if (this.content.forceAnimation && this.isEditing) return animatedPosition;
            if (this.value || this.value === 0) return animatedPosition;
            animatedPosition.cursor = this.$attrs?.style?.cursor || 'text';
            if (this.isDebouncing) return animatedPosition;
            if (this.content.animationTrigger === 'focus' && this.isFocused) return animatedPosition;

            return {
                top: this.placeholderPosition.top,
                left: this.placeholderPosition.left,
                userSelect: 'none',
                transform: 'translate3d(0, 0%, 0) scale(1)',
                transformOrigin: 'left',
                transition,
                cursor: this.$attrs?.style?.cursor || 'text',
            };
        },
        rootBinding() {
            const style = { ...(this.$attrs.style || {}) };
            INPUT_STYLE_PROPERTIES.forEach(property => {
                delete style[property];
            });
            let rootAttrs = {};
            for (const key in this.$attrs) {
                if ((this.state?.attributes || []).some(attr => attr.name === key)) {
                    continue;
                }
                rootAttrs[key] = this.$attrs[key];
            }
            const bindings = {
                ...rootAttrs,
                style,
            };
            delete bindings.id;
            delete bindings.class;

            return bindings;
        },
        inputBinding() {
            let attrs = (this.state?.attributes || []).reduce((acc, attr) => {
                acc[attr.name] = attr.value;
                return acc;
            }, {});
            return { ...attrs, ...(this.wwElementState.props.attributes || {}) };
        },
        style() {
            const style = {};
            for (const property of INPUT_STYLE_PROPERTIES) {
                if (this.$attrs?.style?.[property]) {
                    style[property] = this.$attrs?.style?.[property];
                }
            }

            return style;
        },
        inputType() {
            if (!this.content) return 'text';
            if (this.content.type === 'password') {
                return this.content.displayPassword ? 'text' : 'password';
            }
            return this.content.type === 'decimal' ? 'number' : this.content.type;
        },
        isReadonly() {
            return this.wwElementState.props.readonly === undefined
                ? this.content.readonly
                : this.wwElementState.props.readonly;
        },
        isFocused() {
            return this.isReallyFocused;
        },
        isAdvancedPlaceholder() {
            return this.content.advancedPlaceholder;
        },
        stepAttribute() {
            return !this.isFocused && this.inputType === 'number' ? 'any' : this.step;
        },
        min() {
            if (this.type === 'date') {
                return this.content.minDate;
            } else {
                return this.content.min;
            }
        },
        max() {
            if (this.type === 'date') {
                return this.content.maxDate;
            } else {
                return this.content.max;
            }
        },
    },
    watch: {
        'content.value'(newValue) {
            if (this.type === 'decimal') newValue = this.formatValue(newValue);
            if (newValue === this.value) return;
            this.setValue(newValue);
            this.$emit('trigger-event', { name: 'initValueChange', event: { value: newValue } });
        },
        isReadonly: {
            immediate: true,
            handler() {
                this.$nextTick(() => {
                    this.handleObserver();
                });
            },
        },
        'content.timePrecision'(value) {
            if (typeof this.value !== 'string') return;
            else if (value === 3600) this.setValue(this.value.slice(0, 2));
            else if (value === 60) this.setValue(this.value.slice(0, 5));
            else if (value === 1) this.setValue(this.value.slice(0, 8));
        },
        'content.type'() {
            this.$nextTick(() => {
                this.handleObserver();
            });
        },
        inputRef() {
            this.$nextTick(() => {
                this.handleObserver();
            });
        },
        isReallyFocused(isFocused, wasFocused) {
            if (isFocused && !wasFocused) {
                this.$emit('trigger-event', { name: 'focus' });
            } else if (!isFocused && wasFocused) {
                this.$emit('trigger-event', { name: 'blur' });
            }
        },
        // This is to support legacy advancedPlaceholder
        'content.advancedPlaceholder': {
            async handler(value) {
                this.$nextTick(() => {
                    this.handleObserver();
                });

            },
        },
    },
    beforeUnmount() {
        if (this.resizeObserverContent) this.resizeObserverContent.disconnect();
        if (this.resizeObserverBorder) this.resizeObserverBorder.disconnect();

        wwLib.getFrontDocument().removeEventListener('keyup', this.onKeyEnter);
    },
    mounted() {
        this.isMounted = true;
        this.handleObserver();

        wwLib.getFrontDocument().addEventListener('keyup', this.onKeyEnter);

        if (this.value !== this.$refs.input.value) {
            this.$refs.input.value = this.value;
        }
    },
    methods: {
        handleManualInput(event) {
            const value = event.target.value;
            let newValue;
            if (this.inputType === 'number' && (event.data === '.' || event.data === ',') && value === '') {
                // I dont know why, but 10. is not a valid number, and event.target.value is empty at this moment
                // It's probably depending on the system local, so i have put the ',' usecase as well
                // Returning here prevent the value to be set to null then blinking
                return;
            } else if (this.inputType === 'number' && (value === 0 || (value && value.length))) {
                try {
                    newValue = parseFloat(value);
                } catch (error) {
                    newValue = value;
                }
            } else {
                newValue = value;
            }
            if (newValue === this.value) return;
            this.setValue(newValue);
            if (this.content.debounce) {
                this.isDebouncing = true;
                if (this.debounce) {
                    clearTimeout(this.debounce);
                }
                this.debounce = setTimeout(() => {
                    this.$emit('trigger-event', {
                        name: 'change',
                        event: { domEvent: event, value: newValue },
                    });
                    this.isDebouncing = false;
                }, this.delay);
            } else {
                this.$emit('trigger-event', { name: 'change', event: { domEvent: event, value: newValue } });
            }
        },
        onKeyEnter(event) {
            if (event.key === 'Enter' && this.isReallyFocused)
                this.$emit('trigger-event', { name: 'onEnterKey', event: { value: this.value } });
        },
        onBlur(event) {
            this.correctDecimalValue(event);
            this.isReallyFocused = false;
        },
        correctDecimalValue(event) {
            if (this.content.type === 'decimal') {
                const newValue = this.formatValue(this.value);

                if (newValue === this.value) return;
                this.setValue(newValue);
                this.$emit('trigger-event', { name: 'change', event: { domEvent: event, value: newValue } });
            }
        },
        handleObserver() {
            if (!this.isMounted) return;
            if (this.resizeObserverContent) this.resizeObserverContent.disconnect();
            if (this.resizeObserverBorder) this.resizeObserverBorder.disconnect();
            const el = this.$refs.input;
            if (!el) return;

            // We need both Observers because one of them works outside a ww-modal, while the other in a ww-modal
            this.resizeObserverContent = new ResizeObserver(() => {
                this.updatePosition(el);
            });
            this.resizeObserverBorder = new ResizeObserver(() => {
                this.updatePosition(el);
            });
            this.resizeObserverContent.observe(el, { box: 'content-box' });
            this.resizeObserverBorder.observe(el, { box: 'border-box' });
        },
        updatePosition(el) {
            const placeholder = this.$refs.placeholder;
            if (!el || !placeholder) return;
            this.noTransition = true;

            // The legacy renderer sends visual styles inline and the CSS renderer applies them to
            // the component root. Read the box that owns the styles so both runtimes stay aligned.
            const hasInlineInputStyle = INPUT_STYLE_PROPERTIES.some(property => this.$attrs.style?.[property]);
            const styleElement = hasInlineInputStyle ? el : el.parentElement;
            const computedStyle = window.getComputedStyle(styleElement);
            const paddingTop = parseFloat(computedStyle.paddingTop);
            const paddingBottom = parseFloat(computedStyle.paddingBottom);
            const paddingLeft = parseFloat(computedStyle.paddingLeft);

            if (this.content.type === 'textarea') {
                this.placeholderPosition.top = `${paddingTop}px`;
            } else {
                const inputHeight = styleElement.clientHeight;
                const placeholderHeight = placeholder.clientHeight;
                const availableHeight = inputHeight - paddingTop - paddingBottom;

                if (availableHeight >= placeholderHeight) {
                    const topPosition = paddingTop + (availableHeight - placeholderHeight) / 2;
                    this.placeholderPosition.top = `${topPosition}px`;
                } else {
                    this.placeholderPosition.top = `${paddingTop}px`;
                }
            }

            this.placeholderPosition.left = `${paddingLeft}px`;

            setTimeout(() => {
                this.noTransition = false;
            }, wwLib.wwUtils.getLengthUnit(this.content.transition)[0]);
        },
        // /!\ Use externally
        focusInput() {
            if (this.isReadonly) return;
            const el = this.$refs.input;
            if (el) el.focus();
        },
    },
};
</script>

<style lang="scss" scoped>
.ww-input-basic {
    position: relative;
    isolation: isolate;


    &__input {
        display: block;
        width: 100%;
        min-width: 0;
        height: 100%;
        padding: 0;
        outline: none;
        border: none;
        background-color: transparent;
        border-radius: inherit;
        color: inherit;
        font: inherit;
        letter-spacing: inherit;
        line-height: inherit;
        overflow: var(--ww-text-overflow, initial);
        text-align: inherit;
        text-decoration: inherit;
        text-decoration-color: inherit;
        text-decoration-style: inherit;
        text-overflow: var(--ww-text-text-overflow, initial);
        text-shadow: inherit;
        text-transform: inherit;
        white-space: var(--ww-text-white-space, initial);
        word-spacing: inherit;

        &::placeholder {
            color: var(--placeholder-color, #000000ad);
            font-family: inherit;
            font-size: inherit;
            font-weight: inherit;
            line-height: inherit;
            text-decoration: inherit;
            letter-spacing: inherit;
            word-spacing: inherit;
        }

        &.date-placeholder {
            color: var(--placeholder-color, #000000ad);
            font-family: inherit;
            font-size: inherit;
            font-weight: inherit;
            line-height: inherit;
            text-decoration: inherit;
            letter-spacing: inherit;
            word-spacing: inherit;
        }

        &.hideArrows::-webkit-outer-spin-button,
        &.hideArrows::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        &.hideArrows {
            -moz-appearance: textfield;
        }

        &.-readonly {
            cursor: inherit;
        }
    }

    &__placeholder {
        position: absolute;
        height: fit-content;
        pointer-events: none;
    }
}
</style>
