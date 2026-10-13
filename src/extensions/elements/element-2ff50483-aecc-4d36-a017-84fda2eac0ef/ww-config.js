export default {
    editor: {
        label: {
            en: 'Pixicons icon',
        },
        icon: 'star',
    },
    staticRendering: true,
    options: {
        displayAllowedValues: ['flex', 'inline-flex'],
        linkable: true,
    },
    properties: {
        icon: {
            label: {
                en: 'Icon',
            },
            type: 'Text',
            section: 'settings',
            bindable: true,
            states: true,
            defaultValue: 'heart',
        },
        variant: {
            label: {
                en: 'Variant',
            },
            type: 'TextSelect',
            section: 'settings',
            bindable: true,
            states: true,
            defaultValue: 'regular',
            options: {
                options: [
                    { value: 'regular', label: { en: 'Regular' } },
                    { value: 'fill', label: { en: 'Fill' } },
                ],
            },
        },
        style: {
            label: {
                en: 'Style',
            },
            type: 'TextSelect',
            section: 'settings',
            bindable: true,
            states: true,
            defaultValue: 'pixel',
            options: {
                options: [
                    { value: 'pixel', label: { en: 'Pixel' } },
                    { value: 'rounded', label: { en: 'Rounded' } },
                    { value: 'blob', label: { en: 'Blob' } },
                    { value: 'liquid', label: { en: 'Liquid' } },
                    { value: 'liquid-blob', label: { en: 'Liquid Blob' } },
                    { value: 'retro', label: { en: 'Retro' } },
                    { value: 'stitch', label: { en: 'Stitch' } },
                    { value: 'knit', label: { en: 'Knit' } },
                    { value: 'dots', label: { en: 'Dots' } },
                ],
            },
        },
        accessibleLabel: {
            label: {
                en: 'Accessible label',
            },
            type: 'Text',
            section: 'settings',
            bindable: true,
            defaultValue: '',
        },
        size: {
            label: {
                en: 'Size',
            },
            type: 'Length',
            section: 'style',
            bindable: true,
            states: true,
            responsive: true,
            defaultValue: '24px',
        },
        color: {
            label: {
                en: 'Color',
            },
            type: 'Color',
            section: 'style',
            bindable: true,
            states: true,
            responsive: true,
            defaultValue: '',
        },
    },
    triggerEvents: [],
    actions: [],
};
