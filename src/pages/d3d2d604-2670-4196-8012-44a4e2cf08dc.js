import './styleCompiler/ww-style-page-d3d2d604-2670-4196-8012-44a4e2cf08dc.css';
/*__WW_PAGE_COMPONENT_IMPORTS_START__*/

// eslint-disable-next-line no-undef
import element_1b1e2173_9b78_42cc_a8ee_a6167caea340 from "@/components/elements/element-1b1e2173-9b78-42cc-a8ee-a6167caea340/src/wwElement.vue";
import element_3a7d6379_12d3_4387_98ff_b332bb492a63 from "@/components/elements/element-3a7d6379-12d3-4387-98ff-b332bb492a63/src/wwElement.vue";
import element_57831abf_83ad_49ad_ba97_3bd30b035710 from "@/components/elements/element-57831abf-83ad-49ad-ba97-3bd30b035710/src/wwElement.vue";
import element_59dca300_db78_42e4_a7a6_0cbf22d3cc82 from "@/components/elements/element-59dca300-db78-42e4-a7a6-0cbf22d3cc82/src/wwElement.vue";
import element_9ccf84b0_e542_4423_869f_b4828301ec49 from "@/components/elements/element-9ccf84b0-e542-4423-869f-b4828301ec49/src/wwElement.vue";
import element_b783dc65_d528_4f74_8c14_e27c934c39b1 from "@/components/elements/element-b783dc65-d528-4f74-8c14-e27c934c39b1/src/wwElement.vue";
import element_d7904e9d_fc9a_4d80_9e32_728e097879ad from "@/components/elements/element-d7904e9d-fc9a-4d80-9e32-728e097879ad/src/wwElement.vue";
import element_deb10a01_5eef_4aa1_9017_1b51c2ad6fd0 from "@/components/elements/element-deb10a01-5eef-4aa1-9017-1b51c2ad6fd0/src/wwElement.vue";

// eslint-disable-next-line no-undef
import section_99586bd3_2b15_4d6b_a025_6a50d07ca845 from "@/components/sections/section-99586bd3-2b15-4d6b-a025-6a50d07ca845/src/wwSection.vue";

/*__WW_PAGE_COMPONENT_IMPORTS_END__*/

import { registerSsrPageComponents } from '@/_front/rendering/ssrPageComponents';

let isRegistered = false;

export default async function registerPageComponents(app) {
    if (isRegistered) return;

    if (import.meta.env.SSR) {
        await registerSsrPageComponents(
            app,
            // eslint-disable-next-line no-undef
            /*__WW_SSR_PAGE_COMPONENT_DESCRIPTORS_START__*/
[
    {
        "baseId": "1b1e2173-9b78-42cc-a8ee-a6167caea340",
        "importPath": "@/components/elements/element-1b1e2173-9b78-42cc-a8ee-a6167caea340/src/wwElement.vue",
        "name": "wwobject-1b1e2173-9b78-42cc-a8ee-a6167caea340",
        "type": "element"
    },
    {
        "baseId": "3a7d6379-12d3-4387-98ff-b332bb492a63",
        "importPath": "@/components/elements/element-3a7d6379-12d3-4387-98ff-b332bb492a63/src/wwElement.vue",
        "name": "wwobject-3a7d6379-12d3-4387-98ff-b332bb492a63",
        "type": "element"
    },
    {
        "baseId": "57831abf-83ad-49ad-ba97-3bd30b035710",
        "importPath": "@/components/elements/element-57831abf-83ad-49ad-ba97-3bd30b035710/src/wwElement.vue",
        "name": "wwobject-57831abf-83ad-49ad-ba97-3bd30b035710",
        "type": "element"
    },
    {
        "baseId": "59dca300-db78-42e4-a7a6-0cbf22d3cc82",
        "importPath": "@/components/elements/element-59dca300-db78-42e4-a7a6-0cbf22d3cc82/src/wwElement.vue",
        "name": "wwobject-59dca300-db78-42e4-a7a6-0cbf22d3cc82",
        "type": "element"
    },
    {
        "baseId": "9ccf84b0-e542-4423-869f-b4828301ec49",
        "importPath": "@/components/elements/element-9ccf84b0-e542-4423-869f-b4828301ec49/src/wwElement.vue",
        "name": "wwobject-9ccf84b0-e542-4423-869f-b4828301ec49",
        "type": "element"
    },
    {
        "baseId": "b783dc65-d528-4f74-8c14-e27c934c39b1",
        "importPath": "@/components/elements/element-b783dc65-d528-4f74-8c14-e27c934c39b1/src/wwElement.vue",
        "name": "wwobject-b783dc65-d528-4f74-8c14-e27c934c39b1",
        "type": "element"
    },
    {
        "baseId": "d7904e9d-fc9a-4d80-9e32-728e097879ad",
        "importPath": "@/components/elements/element-d7904e9d-fc9a-4d80-9e32-728e097879ad/src/wwElement.vue",
        "name": "wwobject-d7904e9d-fc9a-4d80-9e32-728e097879ad",
        "type": "element"
    },
    {
        "baseId": "deb10a01-5eef-4aa1-9017-1b51c2ad6fd0",
        "importPath": "@/components/elements/element-deb10a01-5eef-4aa1-9017-1b51c2ad6fd0/src/wwElement.vue",
        "name": "wwobject-deb10a01-5eef-4aa1-9017-1b51c2ad6fd0",
        "type": "element"
    },
    {
        "baseId": "99586bd3-2b15-4d6b-a025-6a50d07ca845",
        "importPath": "@/components/sections/section-99586bd3-2b15-4d6b-a025-6a50d07ca845/src/wwSection.vue",
        "name": "section-99586bd3-2b15-4d6b-a025-6a50d07ca845",
        "type": "section"
    }
]
/*__WW_SSR_PAGE_COMPONENT_DESCRIPTORS_END__*/
        );
    } else {
        // eslint-disable-next-line no-undef
        app.component("wwobject-1b1e2173-9b78-42cc-a8ee-a6167caea340", element_1b1e2173_9b78_42cc_a8ee_a6167caea340);
app.component("wwobject-3a7d6379-12d3-4387-98ff-b332bb492a63", element_3a7d6379_12d3_4387_98ff_b332bb492a63);
app.component("wwobject-57831abf-83ad-49ad-ba97-3bd30b035710", element_57831abf_83ad_49ad_ba97_3bd30b035710);
app.component("wwobject-59dca300-db78-42e4-a7a6-0cbf22d3cc82", element_59dca300_db78_42e4_a7a6_0cbf22d3cc82);
app.component("wwobject-9ccf84b0-e542-4423-869f-b4828301ec49", element_9ccf84b0_e542_4423_869f_b4828301ec49);
app.component("wwobject-b783dc65-d528-4f74-8c14-e27c934c39b1", element_b783dc65_d528_4f74_8c14_e27c934c39b1);
app.component("wwobject-d7904e9d-fc9a-4d80-9e32-728e097879ad", element_d7904e9d_fc9a_4d80_9e32_728e097879ad);
app.component("wwobject-deb10a01-5eef-4aa1-9017-1b51c2ad6fd0", element_deb10a01_5eef_4aa1_9017_1b51c2ad6fd0);

        // eslint-disable-next-line no-undef
        app.component("section-99586bd3-2b15-4d6b-a025-6a50d07ca845", section_99586bd3_2b15_4d6b_a025_6a50d07ca845);
    }

    isRegistered = true;
}
